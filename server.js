const express = require('express');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/authRoutes');
const session = require('express-session');
const path = require('path');

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

// Use auth routes for registration and login
app.use('/auth', authRoutes);

// Start the server
app.listen(3000, () => {
   console.log('Server running on http://localhost:3000');
});
