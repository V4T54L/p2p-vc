const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const router = express.Router();

const USERS_DB = {
    alice: { passwordHash: bcrypt.hashSync('password123', 10) },
    bob: { passwordHash: bcrypt.hashSync('secure456', 10) },
    a: { passwordHash: bcrypt.hashSync('a', 10) },
    b: { passwordHash: bcrypt.hashSync('b', 10) },
};

router.post('/', async (req, res) => {
    const { username, password, room_id } = req.body;
    if (!username || !password || !room_id) {
        return res.status(400).json({ error: 'Missing fields' });
    }

    const user = USERS_DB[username];
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ username, room_id }, process.env.JWT_SECRET, {
        expiresIn: '1h'
    });

    return res.json({ token });
});

module.exports = router;
