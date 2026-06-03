const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.db');

db.run(\"DELETE FROM users WHERE email = 'sinhaaprajeeta2006@gmail.com'\", function(err) {
    if (err) {
        console.error('Error deleting user:', err);
    } else {
        console.log('Successfully deleted the test user from SQLite database. You can now register again!');
    }
    db.close();
});