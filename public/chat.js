import { games } from './games/index.js';

function handleFontAwesome() {
  const showFallback = () => document.body.classList.add('no-fa');
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      if (!document.fonts.check('1em "Font Awesome 6 Free"')) {
        showFallback();
      }
    }).catch(showFallback);
  } else {
    showFallback();
  }
}
handleFontAwesome();

const socket = io();
socket.on('connect_error', err => {
  console.error('Connection error:', err);
  alert('Connection error: ' + (err && err.message ? err.message : err));
});
socket.on('disconnect', reason => {
  console.error('Disconnected:', reason);
  alert('Disconnected from server: ' + reason);
});
window.addEventListener('error', e => {
  const msg = e.message || (e.error && e.error.message) || 'Unknown error';
  console.error('Error:', msg);
  alert('Error: ' + msg);
});
window.addEventListener('unhandledrejection', e => {
  const msg = (e.reason && e.reason.message) || e.reason || 'Unknown error';
  console.error('Error:', msg);
  alert('Error: ' + msg);
});
const form = document.getElementById('form');
const input = document.getElementById('input');
const messages = document.getElementById('messages');
const displayNameEl = document.getElementById('display-name');
const editNameBtn = document.getElementById('edit-name');
const newGameBtn = document.getElementById('new-game');
const gameMenu = document.getElementById('game-menu');
const gameSelect = document.getElementById('game-select');
const startGameBtn = document.getElementById('start-game');
const roomNameEl = document.getElementById('room-name');
const roomToggle = document.getElementById('room-toggle');
const roomMenu = document.getElementById('room-menu');
const roomList = document.getElementById('room-list');
const addRoomBtn = document.getElementById('add-room');
const newRoomInput = document.getElementById('new-room-input');
const imageBtn = document.getElementById('image-btn');
const imageInput = document.getElementById('image-input')
const reactionOptions = ['👍','❤️','😂','😮','😢','😡'];
gameMenu.style.display = 'none';

imageBtn.addEventListener('click', () => imageInput.click());

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
function createUuid() {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // simple fallback
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
let userId = localStorage.getItem('userId');
if (!userId) {
  userId = createUuid();
  localStorage.setItem('userId', userId);
}
window.userId = userId;

let username = localStorage.getItem('username') || '';
if (!username.trim()) {
  let input;
  do {
    input = prompt('Choose a display name');
    if (input === null) break;
  } while (!input.trim());
  username = input ? input.trim() : 'anon';
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
if (editNameBtn) {
  editNameBtn.addEventListener('click', () => displayNameEl.dispatchEvent(new Event('click')));
}
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
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const result = reader.result;
    const [prefix, base64] = result.split(',');
    const mimeMatch = /data:(.*);base64/.exec(prefix);
    const mime = mimeMatch ? mimeMatch[1] : '';
    socket.emit('image', {
      data: base64,
      name: file.name,
      mime,
      user: { id: userId, name: username }
    });
  };
  reader.readAsDataURL(file);
};

function populateGameOptions() {
  gameSelect.innerHTML = '';
  Object.keys(games).forEach(g => {
    const opt = document.createElement('option');
    opt.value = g;
    opt.textContent = g;
    gameSelect.appendChild(opt);
  });
}

newGameBtn.onclick = () => {
  populateGameOptions();
  gameMenu.style.display = gameMenu.style.display === 'none' ? 'block' : 'none';
};

startGameBtn.onclick = () => {
  const game = gameSelect.value;
  if (game && games[game]) {
    socket.emit('start game', { game, user: { id: userId, name: username } });
    gameMenu.style.display = 'none';
  }
};

let currentRoom = localStorage.getItem('room') || 'general';
roomNameEl.textContent = currentRoom;

roomToggle.onclick = () => {
  roomMenu.classList.toggle('open');
  newRoomInput.style.display = 'none';
};

socket.on('room list', rooms => {
  roomList.innerHTML = '';
  rooms.forEach(r => {
    const li = document.createElement('li');
    li.textContent = r;
    if (r === currentRoom) li.classList.add('active');
    li.onclick = () => {
      currentRoom = r;
      localStorage.setItem('room', currentRoom);
      roomNameEl.textContent = currentRoom;
      socket.emit('join room', currentRoom);
      roomMenu.classList.remove('open');
    };
    roomList.appendChild(li);
  });
  if (!rooms.includes(currentRoom)) {
    currentRoom = 'general';
    localStorage.setItem('room', currentRoom);
  }
  roomNameEl.textContent = currentRoom;
  socket.emit('join room', currentRoom);
});

addRoomBtn.onclick = () => {
  newRoomInput.style.display = newRoomInput.style.display === 'none' ? 'block' : 'none';
  if (newRoomInput.style.display !== 'none') {
    newRoomInput.value = '';
    newRoomInput.focus();
  }
};

newRoomInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    e.preventDefault();
    const name = newRoomInput.value.trim();
    if (name) {
      currentRoom = name;
      localStorage.setItem('room', currentRoom);
      roomNameEl.textContent = currentRoom;
      socket.emit('join room', currentRoom);
      roomMenu.classList.remove('open');
      newRoomInput.style.display = 'none';
    }
  }
});

function renderMessage(msg) {
  const item = document.createElement('li');
  item.className = 'msg';
  if (msg.user.id === userId) item.classList.add('self');
  item.dataset.id = msg.id;

  const controls = document.createElement('div');
  controls.className = 'msg-controls';

  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';

  const header = document.createElement('div');
  header.className = 'msg-header';
  const nameSpan = document.createElement('span');
  nameSpan.className = 'msg-user';
  nameSpan.textContent = msg.user.name;
  const timeSpan = document.createElement('span');
  timeSpan.className = 'msg-time';
  timeSpan.textContent =
    smartTime(msg.timestamp) + (msg.edited && !msg.deleted ? ' (edited)' : '');
  header.appendChild(nameSpan);
  header.appendChild(timeSpan);
  bubble.appendChild(header);

  const body = document.createElement('div');
  body.className = 'msg-body';
  if (msg.type === 'image' && !msg.deleted) {
    const img = document.createElement('img');
    img.src = msg.content;
    img.style.maxWidth = '200px';
    body.appendChild(img);
  } else if (msg.type === 'game' && !msg.deleted) {
    const mod = games[msg.content.game];
    if (mod && mod.render) {
      body.appendChild(
        mod.render(msg.content, move => {
          socket.emit('game move', {
            id: msg.id,
            move,
            user: { id: userId, name: username }
          });
        })
      );
    } else {
      const span = document.createElement('span');
      span.textContent = '[Unsupported game]';
      body.appendChild(span);
    }
  } else {
    const span = document.createElement('span');
    span.textContent = msg.deleted ? 'Message removed' : msg.content;
    body.appendChild(span);
  }
  bubble.appendChild(body);

  if (!msg.deleted) {
    const reactionsDiv = document.createElement('div');
    reactionsDiv.className = 'msg-reactions';

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
    addBtn.innerHTML =
      '<i class="fa-regular fa-face-smile" aria-hidden="true"></i><span class="icon-fallback">React</span>';
    addBtn.onclick = e => {
      e.stopPropagation();
      showReactionMenu(msg.id, addBtn);
    };
    reactionsDiv.appendChild(addBtn);

    bubble.appendChild(reactionsDiv);
  }

  if (msg.user.id === userId && !msg.deleted) {
    if (msg.type === 'text') {
      const editBtn = document.createElement('button');
      editBtn.className = 'icon-button';
      editBtn.innerHTML =
        '<i class="fa-regular fa-pen-to-square" aria-hidden="true"></i><span class="icon-fallback">Edit</span>';
      editBtn.onclick = () => {
        const newContent = prompt('Edit message', msg.content);
        if (newContent != null && newContent !== msg.content) {
          socket.emit('edit message', {
            room: currentRoom,
            id: msg.id,
            content: newContent,
            userId
          });
        }
      };
      controls.appendChild(editBtn);
    }

    const delBtn = document.createElement('button');
    delBtn.className = 'icon-button';
    delBtn.innerHTML =
      '<i class="fa-regular fa-trash-can" aria-hidden="true"></i><span class="icon-fallback">Delete</span>';
    delBtn.onclick = () => {
      if (confirm('Delete this message?')) {
        socket.emit('delete message', { room: currentRoom, id: msg.id, userId });
      }
    };
    controls.appendChild(delBtn);
  }

  item.appendChild(controls);
  item.appendChild(bubble);

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
