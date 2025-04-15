require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const socketIo = require('socket.io');

const authRoutes = require('./routes/auth');
const { registerSocketHandlers } = require('./socket');
const socketAuthMiddleware = require('./middleware/socketAuth');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*", // TODO: Restrict this in prod
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);

// Add socket.io middleware
io.use(socketAuthMiddleware);

// Register socket event handlers
io.on('connection', (socket) => {
    registerSocketHandlers(socket);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
