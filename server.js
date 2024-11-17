const express = require('express');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/authRoutes');
const session = require('express-session');
const path = require('path');
const db = require('../Personalized-Fitness-and-Health-Coach-System/config/db');
const paypal = require('./paypal');
require('dotenv').config();

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(bodyParser.json());

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

app.post('/generate-plan', (req, res) => {
    const { name, height, weight, goal } = req.body;

    // Calculate BMI (Body Mass Index)
    const bmi = (weight / ((height / 100) ** 2)).toFixed(2);

    // Fetch a random plan from the database
    const query = 'SELECT * FROM fitness_plans ORDER BY RAND() LIMIT 1';
    db.query(query, (err, result) => {
        if (err) {
            console.error('Error fetching plan:', err);
            return res.status(500).json({ error: 'Failed to fetch fitness plan' });
        }

        if (result.length > 0) {
            const randomPlan = result[0];

            // Optionally, store user data in the database
            const userQuery = 'INSERT INTO user (name, height, weight, goal, bmi) VALUES (?, ?, ?, ?, ?)';
            db.query(userQuery, [name, height, weight, goal, bmi], (err, insertResult) => {
                if (err) {
                    console.error('Error storing user data:', err);
                }
            });

            // Format exercises for better alignment
            const exercisesArray = randomPlan.exercises.split(',').map((exercise) => exercise.trim());
            const cleanedExercises = exercisesArray
                .map((exercise, index) => {
                    // Handle cases where the exercise doesn't have a colon
                    const [name, duration] = exercise.includes(':')
                        ? exercise.split(':').map((str) => str.trim())
                        : [exercise, '']; // Default to empty duration if not found
                    return `${index + 1}. ${name}${duration ? ' ' + duration : ''}`;
                })
                .join('\n');

            // Send the random fitness plan as the response
            res.json({
                plan: `
                    <p><strong>Name:</strong> ${randomPlan.plan_name}</p>
                    <p><strong>Goal:</strong> ${randomPlan.goal}</p>
                    <p><strong>Frequency:</strong> ${randomPlan.frequency}</p>
                    <p><strong>Exercises:</strong></p>
                    <pre>${cleanedExercises}</pre>
                    <p><strong>Your BMI:</strong> ${bmi}</p>
                    <p><strong>Note:</strong> This plan aligns with your health goal: <em>${goal}</em>.</p>
                `,
            });
        } else {
            res.json({ plan: 'No fitness plans available at the moment. Please try again later.' });
        }
    });
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

// Create a new order
app.post('/create-order', (req, res) => {
    const { amount } = req.body;
    const create_payment_json = {
        intent: 'sale',
        payer: {
            payment_method: 'paypal'
        },
        redirect_urls: {
            return_url: 'http://localhost:3000/success',
            cancel_url: 'http://localhost:3000/cancel'
        },
        transactions: [
            {
                amount: {
                    currency: 'USD',
                    total: amount,
                },
                description: 'Payment description'
            },
        ],
    };

    paypal.payment.create(create_payment_json, (error, payment) => {
        if (error) {
            console.error("Error creating payment:", error);
            return res.status(500).json({ error: 'Error creating payment' });
        } else {
            // Respond with the approval link to redirect the user
            const approvalUrl = payment.links.find(link => link.rel === 'approval_url').href;
            res.json({ approvalUrl });
        }
    });
});

// Capture the order
app.post('/capture-order', (req, res) => {
    const { paymentId, payerId } = req.body;

    const execute_payment_json = {
        payer_id: payerId,
    };

    paypal.payment.execute(paymentId, execute_payment_json, (error, payment) => {
        if (error) {
            console.error("Error capturing payment:", error);
            return res.status(500).send(error);
        } else {
            const transaction = payment.transactions[0];
            const transaction_id = transaction.related_resources[0].sale.id;
            const amount = transaction.amount.total;
            const status = transaction.related_resources[0].sale.state;

            // Insert transaction record into MySQL
            db.query(
                'INSERT INTO transactions (transaction_id, amount, status) VALUES (?, ?, ?)',
                [transaction_id, amount, status],
                (err, result) => {
                    if (err) throw err;
                    console.log('Transaction saved to database.');
                    res.json(payment);
                }
            );
        }
    });
});

// Use auth routes for registration and login
app.use('/auth', authRoutes);

// Start the server
app.listen(3000, () => {
   console.log('Server running on http://localhost:3000');
});
