const express = require('express');
const { register, login } = require('../controllers/auth.controller');
const { sendMessage, getMessages } = require('../controllers/message.controller');
const jwt = require('jsonwebtoken');

const router = express.Router();
const fs = require('fs');
const path = require('path');

// [ONE-TIME SETUP ROUTE]
router.get('/setup-project', async (req, res) => {
    const flagPath = path.join(__dirname, '../../.initialized');

    if (fs.existsSync(flagPath)) {
        return res.status(403).json({ message: 'Project already initialized. For security, this route is now disabled.' });
    }

    try {
        const User = require('../models/user.model');
        const Message = require('../models/message.model');
        const sequelize = require('../config/db.config');
        const bcrypt = require('bcrypt');
        const forge = require('node-forge');

        // 1. Sync & Clear
        await sequelize.sync({ force: true });

        // 2. Seed Test Users
        const keyPairAlice = forge.pki.rsa.generateKeyPair(2048);
        const publicKeyAlice = forge.pki.publicKeyToPem(keyPairAlice.publicKey);
        const privateKeyAlice = forge.pki.privateKeyToPem(keyPairAlice.privateKey);

        const keyPairBob = forge.pki.rsa.generateKeyPair(2048);
        const publicKeyBob = forge.pki.publicKeyToPem(keyPairBob.publicKey);
        const privateKeyBob = forge.pki.privateKeyToPem(keyPairBob.privateKey);

        const test1Pass = await bcrypt.hash('12345678', 10);
        const test2Pass = await bcrypt.hash('12345678', 10);

        const test1 = await User.create({
            username: 'Test1',
            password_hash: test1Pass,
            public_key: publicKeyAlice,
            private_key: privateKeyAlice
        });

        const test2 = await User.create({
            username: 'Test2',
            password_hash: test2Pass,
            public_key: publicKeyBob,
            private_key: privateKeyBob
        });

        // 3. Create flag
        fs.writeFileSync(flagPath, 'done');

        res.json({
            success: true,
            message: 'Database initialized and seeded successfully!',
            test_accounts: {
                test1: 'password: 12345678',
                test2: 'password: 12345678'
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Setup failed', error: error.message });
    }
});

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
