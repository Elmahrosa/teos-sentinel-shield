const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Define the database file path in the project root
const dbPath = path.resolve(__dirname, '..', 'teos.db');
// Create a new database instance
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Could not connect to database:', err);
  } else {
    console.log('Connected to SQLite database.');
    // Create the used_txs table if it doesn't exist
    db.run(`
      CREATE TABLE IF NOT EXISTS used_txs (
        tx_hash TEXT PRIMARY KEY,
        user_id INTEGER,
        amount REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('Error creating table:', err);
      } else {
        console.log('Table used_txs ensured.');
      }
    });
  }
});

// Wrapper functions to use promises
function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(this);
      }
    });
  });
}

module.exports = {
  get,
  run,
  // Optionally expose the raw db object if needed
  db
};