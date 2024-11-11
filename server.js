const express = require('express');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/authRoutes');
const session = require('express-session');
const path = require('path');
const db = require('../Personalized-Fitness-and-Health-Coach-System/config/db');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
    secret: 'ad55123hv%56732611gvasdy682346',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

app.use(express.static('public'));

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
    if (req.session.user) {
        return next();
    } else {
        res.redirect('/');
    }
}

app.get('/home', isAuthenticated, (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

// Logout route
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.send("Failed to log out");
        }
        res.redirect('/');
    });
});

// API endpoint to handle form data and generate the plan
app.post('/generate-plan', (req, res) => {
    const { name, height, weight, goal } = req.body;

    // Calculate BMI (Body Mass Index) to assist with plan generation
    const bmi = (weight / ((height / 100) ** 2)).toFixed(2);

    let plan = '';

    // Generate plan based on health goal and BMI
    if (goal === 'lose') {
        plan = `To lose weight, we recommend a high-protein, low-carb diet, and regular cardio exercises. Your BMI is ${bmi}.`;
    } else if (goal === 'gain') {
        plan = `To gain muscle, focus on a balanced diet with a slight calorie surplus, combined with strength training exercises. Your BMI is ${bmi}.`;
    } else {
        plan = `To maintain your weight, follow a balanced diet and exercise routine to stay fit. Your BMI is ${bmi}.`;
    }

    // Optionally, store user data in MySQL for future reference
    const query = 'INSERT INTO user (name, height, weight, goal, bmi) VALUES (?, ?, ?, ?, ?)';
    db.query(query, [name, height, weight, goal, bmi], (err, result) => {
        if (err) throw err;
        console.log('User data inserted:', result);
    });

    res.json({ plan });
});

// Route to handle form submission
app.post('/submit-form', (req, res) => {
    const { name, email, message } = req.body;

    const sql = 'INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)';
    db.query(sql, [name, email, message], (err, result) => {
        if (err) {
            console.error('Failed to insert data into database:', err);
            return res.status(500).json({ error: 'Failed to save data' });
        }
        res.status(200).json({ message: 'Data saved successfully' });
    });
});

// Use auth routes for registration and login
app.use('/auth', authRoutes);

// Start the server
app.listen(3000, () => {
   console.log('Server running on http://localhost:3000');
});
