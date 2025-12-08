const db = require("./database");

// Liste de ta classe
// Pour l'instant avatar: null → le site utilisera default-avatar.png
// Quand tu auras les photos, tu pourras mettre par ex. "avatars/ilona_d.jpg"
const students = [
  { name: "Ilona D", avatar: null },
  { name: "Lola B", avatar: null },
  { name: "Ambre A", avatar: null },
  { name: "Auriane P", avatar: null },
  { name: "Océane P", avatar: null },
  { name: "Léo S", avatar: null },
  { name: "Lucas F", avatar: null },
  { name: "Tom C", avatar: null },
  { name: "Lorys C", avatar: null },
  { name: "Alix R", avatar: null },
  { name: "Jordan L", avatar: null },
  { name: "Théo D", avatar: null },
  { name: "Mattéo S", avatar: null },
  { name: "Clément R", avatar: null },
  { name: "Antoine P", avatar: null },
  { name: "Madeline C", avatar: null },
  { name: "Chloé D", avatar: null },
  { name: "Sandro D", avatar: null },
  { name: "Matis R", avatar: null },
  { name: "Sven D", avatar: null },
  { name: "Margaux S", avatar: null },
  { name: "Mathis M", avatar: null },
  { name: "Tom V", avatar: null },
  { name: "Chloé P", avatar: null },
  { name: "Ethane N", avatar: null },
  { name: "Mano C", avatar: null },
  { name: "Célia M", avatar: null },
  { name: "Titouan C", avatar: null },
  { name: "Hugo N", avatar: null },
  { name: "Noéline G", avatar: null },
  { name: "Philéas M", avatar: null },
  { name: "Kelvin B", avatar: null },
  { name: "Jimmy L", avatar: null },
  { name: "Maxence B", avatar: null },
  { name: "Tony C", avatar: null },
  { name: "Sixte E", avatar: null },
  { name: "Antonin L", avatar: null },
  { name: "Enzo L", avatar: null },
  { name: "Marin C", avatar: null },
  { name: "Louis L", avatar: null },
  { name: "Baptiste P", avatar: null },
  { name: "Théo B", avatar: null },
  { name: "Thibaut C", avatar: null },
  { name: "Mathis B", avatar: null },
  { name: "Mathias R", avatar: null },
  { name: "Abel F", avatar: null },
];

db.serialize(() => {
  // On vide la table avant de remplir (pour repartir propre)
  db.run("DELETE FROM students", [], (err) => {
    if (err) {
      console.error("Erreur lors du nettoyage de la table students :", err);
      return;
    }

    const stmt = db.prepare(
      "INSERT INTO students (name, avatar, elo) VALUES (?, ?, 1000)"
    );

    students.forEach((s) => {
      stmt.run(s.name, s.avatar);
    });

    stmt.finalize((err2) => {
      if (err2) {
        console.error("Erreur lors de l'insertion :", err2);
      } else {
        console.log("Insertion de la classe terminée ✅");
      }
      db.close();
    });
  });
});
