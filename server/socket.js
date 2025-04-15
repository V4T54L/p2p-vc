const usersMap = new Map();
const roomsMap = new Map();
// myMap.set('name', 'John');
// myMap.set('age', 30);


function getUser(username) {
    const exists = usersMap.has(username)
    if (!exists) {
        return null
    }
    const user = usersMap.get(username)
    return user
}

function getUserInRoom(room_id) {
    const exists = roomsMap.has(room_id)
    if (!exists) {
        return [null, null]
    }
    const username = roomsMap.get(room_id)

    return [getUser(username), username]
}

function registerSocketHandlers(socket) {
    const { username, room_id } = socket.user;

    // console.log(`${username} connected to room: ${room_id}`);
    usersMap.set(username, socket)

    socket.on('join-room', () => {
        // socket.join(room_id);
        // socket.to(room_id).emit('user-joined', { username });
        // console.log(`${username} joined room ${room_id}`);
        console.log(`${username} requested to join room ${room_id}`);
        const [user, otherUsername] = getUserInRoom(room_id);
        roomsMap.set(room_id, username);
        if (user) {
            console.log(`requesting ${otherUsername} to send offer`);
            user.emit('send-offer');
        }
    });

    socket.on('offer', ({ offer }) => {
        console.log(`${username} sent offer`);
        const [user, otherUsername] = getUserInRoom(room_id);
        roomsMap.set(room_id, username);
        if (user) {
            console.log(`requesting ${otherUsername} to send answer`);
            user.emit('send-answer', { offer, senderUsername: username });
        }
    });

    socket.on('answer', ({ answer }) => {
        console.log(`${username} sent answer`);
        const [user, otherUsername] = getUserInRoom(room_id);
        if (user) {
            user.emit('connect-peer', { answer, senderUsername: username });
        }
        roomsMap.delete(room_id);
    });

    socket.on('disconnect', () => {
        usersMap.delete(username)
        console.log(`${username} disconnected`);
    });
}

module.exports = { registerSocketHandlers };
