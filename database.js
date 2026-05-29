const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the SQLite database.');
});

db.serialize(() => {
    // Create Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        email TEXT UNIQUE,
        password TEXT,
        bio TEXT,
        status TEXT DEFAULT 'offline'
    )`, (err) => {
        if (err) console.error('Error creating users table:', err.message);
    });

    // Attempt to add name column if it doesn't exist to support existing databases
    db.run(`ALTER TABLE users ADD COLUMN name TEXT`, (err) => {
        // We can safely ignore the error if the column already exists
    });

    // Create Groups table
    db.run(`CREATE TABLE IF NOT EXISTS groups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        description TEXT,
        type TEXT,
        code TEXT
    )`, (err) => {
        if (err) console.error('Error creating groups table:', err.message);
    });

    // Create Posts table
    db.run(`CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_id INTEGER,
        author_email TEXT,
        content TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (group_id) REFERENCES groups (id)
    )`, (err) => {
        if (err) console.error('Error creating posts table:', err.message);
    });

    // Create Group Members table
    db.run(`CREATE TABLE IF NOT EXISTS group_members (
        group_id INTEGER,
        user_email TEXT,
        PRIMARY KEY (group_id, user_email),
        FOREIGN KEY (group_id) REFERENCES groups (id),
        FOREIGN KEY (user_email) REFERENCES users (email)
    )`, (err) => {
        if (err) console.error('Error creating group_members table:', err.message);
    });

    // Create Reports table
    db.run(`CREATE TABLE IF NOT EXISTS reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        email TEXT,
        anonymous BOOLEAN,
        platform TEXT,
        type TEXT,
        severity TEXT,
        details TEXT,
        status TEXT DEFAULT 'pending',
        trusted_contact_name TEXT,
        trusted_contact_email TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) console.error('Error creating reports table:', err.message);
    });

    db.run(`ALTER TABLE reports ADD COLUMN trusted_contact_name TEXT`, (err) => {});
    db.run(`ALTER TABLE reports ADD COLUMN trusted_contact_email TEXT`, (err) => {});

    // Create Report Messages table
    db.run(`CREATE TABLE IF NOT EXISTS report_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        report_id INTEGER,
        sender TEXT,
        message TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (report_id) REFERENCES reports (id)
    )`, (err) => {
        if (err) console.error('Error creating report_messages table:', err.message);
    });

    // Insert a default admin user with a fixed password if not exists
    const adminEmail = 'anushashetty242@gmail.com';
    const adminPassword = 'admin123';
    bcrypt.hash(adminPassword, 10, (hashErr, hash) => {
        if (hashErr) {
            console.error('Error hashing admin password:', hashErr);
            return;
        }
        db.run(
            `INSERT INTO users (email, password) SELECT ?, ? WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = ?)`,
            [adminEmail, hash, adminEmail],
            function(err) {
                if (err) {
                    console.error('Error inserting admin user:', err.message);
                } else if (this.changes > 0) {
                    console.log('Default admin user created.');
                }
                db.close((closeErr) => {
                    if (closeErr) {
                        console.error(closeErr.message);
                    }
                    console.log('Closed the database connection.');
                });
            }
        );
    });
});
