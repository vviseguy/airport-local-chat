const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { Chat } = require('./chatModel');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const chat = new Chat(path.join(__dirname, 'chat.json'));

app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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

  socket.on('image', ({ data, name, user }) => {
    const id = uuidv4();
    const ext = path.extname(name) || '.png';
    const fileName = `${id}${ext}`;
    const filePath = path.join(__dirname, 'uploads', fileName);
    fs.writeFileSync(filePath, Buffer.from(data, 'base64'));
    const message = chat.addMessage({ user, type: 'image', content: `/uploads/${fileName}` });
    io.emit('image', message);
  });

  socket.on('start game', ({ game, user }) => {
    if (game === 'tictactoe') {
      const message = chat.addMessage({
        user,
        type: 'game',
        content: {
          game: 'tictactoe',
          board: Array(9).fill(null),
          players: [user],
          next: user.id,
          winner: null
        }
      });
      io.emit('start game', message);
    }
  });

  socket.on('game move', ({ id, index, user }) => {
    const msg = chat.messages.find(m => m.id === id && m.type === 'game');
    if (!msg) return;
    const game = msg.content;
    if (game.game === 'tictactoe' && !game.winner && game.next === user.id && !game.board[index]) {
      if (!game.players.find(p => p.id === user.id)) {
        if (game.players.length < 2) game.players.push(user);
      }
      const symbol = game.players[0].id === user.id ? 'X' : 'O';
      game.board[index] = symbol;
      const lines = [
        [0,1,2],[3,4,5],[6,7,8],
        [0,3,6],[1,4,7],[2,5,8],
        [0,4,8],[2,4,6]
      ];
      for (const line of lines) {
        const [a,b,c] = line;
        if (game.board[a] && game.board[a] === game.board[b] && game.board[a] === game.board[c]) {
          game.winner = symbol;
        }
      }
      if (!game.winner && game.board.every(v => v)) {
        game.winner = 'draw';
      }
      if (!game.winner) {
        const other = game.players.find(p => p.id !== user.id);
        if (other) game.next = other.id;
      }
      const updated = chat.editMessage(id, game);
      if (updated) io.emit('game update', updated);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
