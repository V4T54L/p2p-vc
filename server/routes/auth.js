const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const router = express.Router();

const USERS_DB = {
    alice: { passwordHash: bcrypt.hashSync('password123', 10) },
    bob: { passwordHash: bcrypt.hashSync('secure456', 10) }
};

router.post('/', async (req, res) => {
    const { username, password, roomId } = req.body;
    if (!username || !password || !roomId) {
        return res.status(400).json({ error: 'Missing fields' });
    }

    const user = USERS_DB[username];
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ username, roomId }, process.env.JWT_SECRET, {
        expiresIn: '1h'
    });

    return res.json({ token });
});

module.exports = router;
