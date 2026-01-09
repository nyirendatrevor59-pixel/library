const Database = require('better-sqlite3');
const db = new Database('database.db');

// Delete all tutor requests
const deleteStmt = db.prepare('DELETE FROM tutor_requests');
const result = deleteStmt.run();

console.log(`Deleted ${result.changes} tutor requests`);

db.close();