const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const { v4: uuidv4 } = require('uuid');
const { Chat } = require('./chatModel');
const games = require('./games');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const chat = new Chat(path.join(__dirname, 'chat.json'));

app.use('/fontawesome', express.static(path.join(__dirname, 'node_modules', '@fortawesome', 'fontawesome-free')));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(uploadDir));

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

  socket.on('image', ({ room = currentRoom, data, name, user }) => {
    const id = uuidv4();
    const ext = path.extname(name) || '.png';
    const fileName = `${id}${ext}`;
    const filePath = path.join(__dirname, 'uploads', fileName);
    fs.writeFileSync(filePath, Buffer.from(data, 'base64'));
    const message = chat.addMessage(room, { user, type: 'image', content: `/uploads/${fileName}` });
    io.to(room).emit('image', message);
  });

  socket.on('start game', ({ game, user }) => {
    const mod = games[game];
    if (!mod) return;
    const state = mod.createGame(user);
    const message = chat.addMessage(currentRoom, {
      user,
      type: 'game',
      content: state
    });
    io.to(currentRoom).emit('start game', message);
  });

  socket.on('game move', ({ id, move, user }) => {
    let foundRoom = null;
    let msg = null;
    for (const [room, msgs] of Object.entries(chat.rooms)) {
      const m = msgs.find(mm => mm.id === id && mm.type === 'game');
      if (m) { foundRoom = room; msg = m; break; }
    }
    if (!msg) return;
    const mod = games[msg.content.game];
    if (!mod) return;
    const newState = mod.applyMove(msg.content, move, user);
    if (newState) {
      const updated = chat.editMessage(foundRoom, id, newState);
      if (updated) io.to(foundRoom).emit('game update', updated);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
