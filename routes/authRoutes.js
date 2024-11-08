const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Register route
router.post('/register', authController.register);

// Login route
router.post('/login', authController.login);

// Route to update password
router.post('/update-password', authController.updatePassword);

module.exports = router;
