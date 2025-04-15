function registerSocketHandlers(socket) {
    const { username, roomId } = socket.user;

    console.log(`${username} connected`);

    socket.on('join-room', () => {
        socket.join(roomId);
        socket.to(roomId).emit('user-joined', { username });
        console.log(`${username} joined room ${roomId}`);
    });

    socket.on('disconnect', () => {
        console.log(`${username} disconnected`);
    });
}

module.exports = { registerSocketHandlers };
