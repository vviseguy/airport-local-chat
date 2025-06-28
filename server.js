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
  // send existing messages to new client
  socket.emit('chat history', chat.messages);

  socket.on('chat message', msg => {
    const message = chat.addMessage(msg);
    io.emit('chat message', message);
  });

  socket.on('edit message', ({ id, content, userId }) => {
    const msg = chat.editMessage(id, content);
    if (msg && msg.user.id === userId) {
      io.emit('edit message', msg);
    }
  });

  socket.on('delete message', ({ id, userId }) => {
    const msg = chat.deleteMessage(id);
    if (msg && msg.user.id === userId) {
      io.emit('delete message', msg);
    }
  });

  socket.on('reaction', ({ id, emoji, user }) => {
    const msg = chat.toggleReaction(id, emoji, user);
    if (msg) {
      io.emit('reaction', msg);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
