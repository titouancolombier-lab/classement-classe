const express = require("express");
const cors = require("cors");
const db = require("./database");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static("public")); // sert index.html, admin.html, images...

// ---------- Elo ----------
function updateElo(ra, rb, winnerIsA) {
  const K = 32;
  const Ea = 1 / (1 + Math.pow(10, (rb - ra) / 400));
  const Sa = winnerIsA ? 1 : 0;
  const newRa = ra + K * (Sa - Ea);
  const newRb = rb + K * ((1 - Sa) - (1 - Ea)); // équivalent pour l'autre
  return { newRa, newRb };
}

// ---------- API : classement (avec option ?limit=3) ----------
app.get("/api/students", (req, res) => {
  const limit = parseInt(req.query.limit, 10);
  let sql = "SELECT id, name, avatar, elo FROM students ORDER BY elo DESC";
  const params = [];

  if (!isNaN(limit)) {
    sql += " LIMIT ?";
    params.push(limit);
  }

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// ---------- API : duel, max 2 fois par jour la même paire ----------

// compte combien de fois cette paire a déjà été jouée aujourd'hui
function getTodayPairCount(aId, bId, cb) {
  const sql = `
    SELECT COUNT(*) as c
    FROM matches
    WHERE (
      (studentA_id = ? AND studentB_id = ?)
      OR
      (studentA_id = ? AND studentB_id = ?)
    )
    AND date(created_at) = date('now')
  `;
  db.get(sql, [aId, bId, bId, aId], (err, row) => {
    if (err) return cb(err);
    cb(null, row.c);
  });
}

app.get("/api/pair", (req, res) => {
  db.all("SELECT id, name, avatar, elo FROM students", [], (err, students) => {
    if (err) return res.status(500).json({ error: err.message });
    if (students.length < 2) {
      return res.status(400).json({ error: "Pas assez d'élèves pour un duel" });
    }

    const maxAttempts = 30;

    function tryPick(attempt) {
      if (attempt >= maxAttempts) {
        // Si on n’a pas trouvé de paire “fraîche”, on renvoie une paire au hasard
        const shuffled = [...students].sort(() => Math.random() - 0.5);
        return res.json(shuffled.slice(0, 2));
      }

      const i = Math.floor(Math.random() * students.length);
      let j = Math.floor(Math.random() * students.length);
      while (j === i) {
        j = Math.floor(Math.random() * students.length);
      }

      const a = students[i];
      const b = students[j];

      getTodayPairCount(a.id, b.id, (err2, count) => {
        if (err2) return res.status(500).json({ error: err2.message });

        if (count >= 2) {
          // déjà vu 2 fois aujourd’hui → on réessaie
          return tryPick(attempt + 1);
        } else {
          return res.json([a, b]);
        }
      });
    }

    tryPick(0);
  });
});

// ---------- API : vote ----------
app.post("/api/vote", (req, res) => {
  const { winnerId, loserId } = req.body;

  if (!winnerId || !loserId) {
    return res.status(400).json({ error: "winnerId et loserId sont requis" });
  }

  db.all(
    "SELECT id, name, avatar, elo FROM students WHERE id IN (?, ?)",
    [winnerId, loserId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      if (rows.length !== 2) {
        return res.status(404).json({ error: "Élève(s) non trouvé(s)" });
      }

      const s1 = rows[0];
      const s2 = rows[1];

      const winnerIsFirst = s1.id === Number(winnerId);
      const winner = winnerIsFirst ? s1 : s2;
      const loser = winnerIsFirst ? s2 : s1;

      const { newRa, newRb } = updateElo(winner.elo, loser.elo, true);

      db.serialize(() => {
        db.run(
          "UPDATE students SET elo = ? WHERE id = ?",
          [newRa, winner.id]
        );
        db.run(
          "UPDATE students SET elo = ? WHERE id = ?",
          [newRb, loser.id]
        );
        db.run(
          "INSERT INTO matches (studentA_id, studentB_id) VALUES (?, ?)",
          [winner.id, loser.id],
          function (err2) {
            if (err2) {
              return res.status(500).json({ error: err2.message });
            }
            res.json({
              message: "Vote pris en compte",
              winner: { ...winner, elo: newRa },
              loser: { ...loser, elo: newRb },
            });
          }
        );
      });
    }
  );
});
// ---------- API : reset du classement (admin) ----------
app.post("/api/admin/reset", (req, res) => {
  db.serialize(() => {
    // Remet tous les ELO à 1000
    db.run("UPDATE students SET elo = 1000", [], (err) => {
      if (err) return res.status(500).json({ error: err.message });

      // On supprime aussi l'historique des matches
      db.run("DELETE FROM matches", [], (err2) => {
        if (err2) return res.status(500).json({ error: err2.message });

        res.json({ message: "Classement réinitialisé, tous les ELO = 1000" });
      });
    });
  });
});

app.listen(PORT, () => {
  console.log("Serveur lancé sur http://localhost:" + PORT);
});
