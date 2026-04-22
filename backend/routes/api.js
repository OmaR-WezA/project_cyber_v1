const express = require('express');
const { register, login } = require('../controllers/auth.controller');
const { sendMessage, getMessages } = require('../controllers/message.controller');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Auth Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: 'Access denied' });

    jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey', (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid token' });
        req.user = user;
        next();
    });
};

// Auth routes
router.post('/register', register);
router.post('/login', login);

// User routes
const User = require('../models/user.model');
router.get('/users', authenticateToken, async (req, res) => {
    const { Op } = require('sequelize');
    const users = await User.findAll({
        where: { id: { [Op.ne]: req.user.id } },
        attributes: ['id', 'username', 'public_key']
    });
    res.json(users);
});

router.get('/me', authenticateToken, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching profile' });
    }
});

// Message routes
router.post('/send-message', authenticateToken, sendMessage);
router.get('/messages', authenticateToken, getMessages);

module.exports = router;
