const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.db');

db.run("DELETE FROM users", function(err) {
    if (err) {
        console.error("Error deleting users:", err);
    } else {
        console.log("Successfully cleared all users from SQLite database.");
    }
    db.close();
});