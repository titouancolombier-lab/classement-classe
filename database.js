const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./students.db");

db.serialize(() => {
  // Table des élèves
  db.run(`
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      avatar TEXT,
      elo REAL NOT NULL DEFAULT 1000
    )
  `);

  // Table des duels (pour limiter à 2 par jour)
  db.run(`
    CREATE TABLE IF NOT EXISTS matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      studentA_id INTEGER NOT NULL,
      studentB_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

module.exports = db;
