const socket = io();
const form = document.getElementById('form');
const input = document.getElementById('input');
const messages = document.getElementById('messages');
const displayNameEl = document.getElementById('display-name');
const newGameBtn = document.getElementById('new-game');
const roomNameEl = document.getElementById('room-name');
const changeRoomBtn = document.getElementById('change-room');
const roomMenu = document.getElementById('room-menu');
const roomSelect = document.getElementById('room-select');
const addRoomBtn = document.getElementById('add-room');
const imageBtn = document.getElementById('image-btn');
const imageInput = document.getElementById('image-input');
const reactionOptions = ['👍','❤️','😂','😮','😢','😡'];
roomMenu.style.display = 'none';

imageBtn.addEventListener('click', () => imageInput.click());
imageInput.addEventListener('change', () => {
  const file = imageInput.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const msg = {
      room: currentRoom,
      user: { id: userId, name: username },
      type: 'image',
      content: reader.result
    };
    socket.emit('chat message', msg);
  };
  reader.readAsDataURL(file);
  imageInput.value = '';
});

function smartTime(ts) {
  const d = new Date(ts);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const opts = { hour: '2-digit', minute: '2-digit' };
  if (sameDay) return d.toLocaleTimeString([], opts);
  const sameYear = d.getFullYear() === now.getFullYear();
  const dateOpts = sameYear
    ? { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
    : { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  return d.toLocaleDateString([], dateOpts);
}

// user identification stored locally
let userId = localStorage.getItem('userId');
if (!userId) {
  userId = crypto.randomUUID();
  localStorage.setItem('userId', userId);
}

let username = localStorage.getItem('username');
if (!username) {
  username = prompt('Choose a display name') || 'anon';
  localStorage.setItem('username', username);
}
displayNameEl.textContent = username;
displayNameEl.addEventListener('click', () => {
  displayNameEl.contentEditable = 'true';
  const range = document.createRange();
  range.selectNodeContents(displayNameEl);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
});
displayNameEl.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    e.preventDefault();
    displayNameEl.blur();
  }
});
displayNameEl.addEventListener('blur', () => {
  displayNameEl.contentEditable = 'false';
  const newName = displayNameEl.textContent.trim();
  if (newName) {
    username = newName;
    localStorage.setItem('username', username);
  } else {
    displayNameEl.textContent = username;
  }
});

imageInput.onchange = () => {
  const file = imageInput.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      socket.emit('image', { data: base64, name: file.name, user: { id: userId, name: username } });
    };
    reader.readAsDataURL(file);
  }
};

newGameBtn.onclick = () => {
  const game = prompt('Start which game? (tictactoe)');
  if (game === 'tictactoe') {
    socket.emit('start game', { game: 'tictactoe', user: { id: userId, name: username } });
  }
};

let currentRoom = localStorage.getItem('room') || 'general';
roomNameEl.textContent = currentRoom;

changeRoomBtn.onclick = () => {
  roomMenu.style.display = roomMenu.style.display === 'none' ? 'block' : 'none';
};

socket.on('room list', rooms => {
  roomSelect.innerHTML = '';
  rooms.forEach(r => {
    const opt = document.createElement('option');
    opt.value = r;
    opt.textContent = r;
    roomSelect.appendChild(opt);
  });
  if (!rooms.includes(currentRoom)) {
    currentRoom = 'general';
    localStorage.setItem('room', currentRoom);
  }
  roomSelect.value = currentRoom;
  roomNameEl.textContent = currentRoom;
  socket.emit('join room', currentRoom);
});

roomSelect.onchange = () => {
  currentRoom = roomSelect.value;
  localStorage.setItem('room', currentRoom);
  roomNameEl.textContent = currentRoom;
  socket.emit('join room', currentRoom);
  roomMenu.style.display = 'none';
};

addRoomBtn.onclick = () => {
  const name = prompt('Enter new room name');
  if (name) {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    roomSelect.appendChild(opt);
    currentRoom = name;
    roomSelect.value = name;
    localStorage.setItem('room', currentRoom);
    roomNameEl.textContent = currentRoom;
    socket.emit('join room', currentRoom);
    roomMenu.style.display = 'none';
  }
};

function renderMessage(msg) {
  const item = document.createElement('li');
  item.className = 'msg';
  if (msg.user.id === userId) item.classList.add('self');
  item.dataset.id = msg.id;
  const time = new Date(msg.timestamp).toLocaleTimeString();
  const header = document.createElement('div');
  header.textContent = `[${time}] ${msg.user.name}:`;
  item.appendChild(header);

  if (msg.type === 'image' && !msg.deleted) {
    const img = document.createElement('img');
    img.src = msg.content;
    img.style.maxWidth = '200px';
    item.appendChild(img);
  } else if (msg.type === 'game' && !msg.deleted && msg.content.game === 'tictactoe') {
    item.appendChild(renderTicTacToe(msg));
  } else {
    let content = msg.deleted ? 'Message removed' : msg.content;
    if (msg.edited && !msg.deleted) {
      content += ' (edited)';
    }
    const span = document.createElement('span');
    span.textContent = content;
    item.appendChild(span);
  }

  const meta = document.createElement('div');
  meta.className = 'meta';
  let contentEl;
  if (msg.type === 'image' && !msg.deleted) {
    contentEl = document.createElement('img');
    contentEl.src = msg.content;
    contentEl.style.maxWidth = '100%';
  } else {
    contentEl = document.createElement('span');
    contentEl.className = 'text';
    contentEl.textContent = msg.deleted ? 'Message removed' : msg.content;
  }
  const info = document.createElement('span');
  info.className = 'time';
  info.textContent = smartTime(msg.timestamp);
  meta.innerHTML = `<strong>${msg.user.name}:</strong> `;
  meta.appendChild(contentEl);
  meta.appendChild(info);
  if (msg.edited && !msg.deleted) meta.insertAdjacentHTML('beforeend', ' <em>(edited)</em>');
  item.appendChild(meta);

  if (!msg.deleted) {
    const reactionsDiv = document.createElement('div');
    reactionsDiv.className = 'reactions';

    if (msg.reactions) {
      Object.entries(msg.reactions).forEach(([emoji, users]) => {
        if (users.length) {
          const rSpan = document.createElement('span');
          rSpan.textContent = `${emoji} ${users.length}`;
          rSpan.title = users.map(u => u.name).join(', ');
          rSpan.onclick = () => showReactionMenu(msg.id, rSpan);
          reactionsDiv.appendChild(rSpan);
        }
      });
    }

    const addBtn = document.createElement('button');
    addBtn.className = 'icon-button';
    addBtn.innerHTML = '<i class="fa-regular fa-face-smile" aria-hidden="true"></i><span class="icon-fallback">React</span>';
    addBtn.onclick = e => {
      e.stopPropagation();
      showReactionMenu(msg.id, addBtn);
    };
    reactionsDiv.appendChild(addBtn);

    item.appendChild(reactionsDiv);
  }

  if (msg.user.id === userId && !msg.deleted && msg.type === 'text') {
    const editBtn = document.createElement('button');
    editBtn.className = 'icon-button';
    editBtn.innerHTML = '<i class="fa-regular fa-pen-to-square" aria-hidden="true"></i><span class="icon-fallback">Edit</span>';
    editBtn.onclick = () => {
      const newContent = prompt('Edit message', msg.content);
      if (newContent != null && newContent !== msg.content) {
        socket.emit('edit message', { room: currentRoom, id: msg.id, content: newContent, userId });
      }
    };
    item.appendChild(editBtn);

    const delBtn = document.createElement('button');
    delBtn.className = 'icon-button';
    delBtn.innerHTML = '<i class="fa-regular fa-trash-can" aria-hidden="true"></i><span class="icon-fallback">Delete</span>';
    delBtn.onclick = () => {
      if (confirm('Delete this message?')) {
        socket.emit('delete message', { room: currentRoom, id: msg.id, userId });
      }
    };
    item.appendChild(delBtn);
  }

  return item;
}

function appendMessage(msg) {
  messages.appendChild(renderMessage(msg));
  messages.scrollTop = messages.scrollHeight;
}

function updateMessage(msg) {
  const existing = document.querySelector(`li[data-id="${msg.id}"]`);
  if (existing) {
    const newItem = renderMessage(msg);
    messages.replaceChild(newItem, existing);
  }
}

function renderTicTacToe(msg) {
  const wrapper = document.createElement('div');
  wrapper.className = 'ttt';
  const table = document.createElement('table');
  const board = msg.content.board;
  for (let r = 0; r < 3; r++) {
    const row = document.createElement('tr');
    for (let c = 0; c < 3; c++) {
      const idx = r * 3 + c;
      const cell = document.createElement('td');
      cell.textContent = board[idx] || '';
      if (!board[idx] && msg.content.next === userId && (!msg.content.winner)) {
        cell.style.cursor = 'pointer';
        cell.onclick = () => {
          socket.emit('game move', { id: msg.id, index: idx, user: { id: userId, name: username } });
        };
      }
      row.appendChild(cell);
    }
    table.appendChild(row);
  }
  wrapper.appendChild(table);
  if (msg.content.winner) {
    const info = document.createElement('div');
    if (msg.content.winner === 'draw') {
      info.textContent = 'Draw!';
    } else {
      const idx = msg.content.winner === 'X' ? 0 : 1;
      const player = msg.content.players[idx];
      info.textContent = `${player ? player.name : msg.content.winner} wins`;
    }
    wrapper.appendChild(info);
  }
  return wrapper;
}

let openMenu = null;
function showReactionMenu(messageId, anchor) {
  if (openMenu) openMenu.remove();
  const menu = document.createElement('div');
  menu.className = 'reaction-menu';
  reactionOptions.forEach(emoji => {
    const btn = document.createElement('button');
    btn.textContent = emoji;
    btn.onclick = e => {
      e.stopPropagation();
      socket.emit('reaction', { room: currentRoom, id: messageId, emoji, user: { id: userId, name: username } });
      menu.remove();
      openMenu = null;
    };
    menu.appendChild(btn);
  });
  anchor.parentNode.insertBefore(menu, anchor.nextSibling);
  openMenu = menu;
}

socket.on('chat history', history => {
  messages.innerHTML = '';
  history.forEach(m => appendMessage(m));
});

socket.on('chat message', appendMessage);
socket.on('edit message', updateMessage);
socket.on('delete message', updateMessage);
socket.on('reaction', updateMessage);
socket.on('image', appendMessage);
socket.on('start game', appendMessage);
socket.on('game update', updateMessage);

form.addEventListener('submit', e => {
  e.preventDefault();
  if (input.value) {
    const msg = {
      room: currentRoom,
      user: { id: userId, name: username },
      type: 'text',
      content: input.value
    };
    socket.emit('chat message', msg);
    input.value = '';
  }
});
