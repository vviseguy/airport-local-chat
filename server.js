const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { Chat } = require('./chatModel');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const chat = new Chat(path.join(__dirname, 'chat.json'));

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', socket => {
  let currentRoom = 'general';

  socket.join(currentRoom);
  socket.emit('room list', chat.listRooms());
  socket.emit('chat history', chat.getMessages(currentRoom));

  socket.on('join room', room => {
    socket.leave(currentRoom);
    currentRoom = room || 'general';
    socket.join(currentRoom);
    socket.emit('chat history', chat.getMessages(currentRoom));
  });

  socket.on('chat message', ({ room = currentRoom, ...msg }) => {
    const message = chat.addMessage(room, msg);
    io.to(room).emit('chat message', message);
    io.emit('room list', chat.listRooms());
  });

  socket.on('edit message', ({ room = currentRoom, id, content, userId }) => {
    const msg = chat.editMessage(room, id, content);
    if (msg && msg.user.id === userId) {
      io.to(room).emit('edit message', msg);
    }
  });

  socket.on('delete message', ({ room = currentRoom, id, userId }) => {
    const msg = chat.deleteMessage(room, id);
    if (msg && msg.user.id === userId) {
      io.to(room).emit('delete message', msg);
    }
  });

  socket.on('reaction', ({ room = currentRoom, id, emoji, user }) => {
    const msg = chat.toggleReaction(room, id, emoji, user);
    if (msg) {
      io.to(room).emit('reaction', msg);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
