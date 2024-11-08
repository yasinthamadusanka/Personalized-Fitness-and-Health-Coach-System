const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'user1',
    password: 'password',      
    database: 'fitness_coach'
});

db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err.stack);
        return;
    }
    console.log('Connected to database');
});

module.exports = db;
