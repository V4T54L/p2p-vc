const jwt = require('jsonwebtoken');

module.exports = function (socket, next) {
    const token = socket.handshake.auth.token;

    if (!token) {
        return next(new Error('Authentication token missing'));
    }

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = payload;
        next();
    } catch (err) {
        return next(new Error('Invalid or expired token'));
    }
};
