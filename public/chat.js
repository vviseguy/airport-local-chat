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
const form = document.getElementById('form');
const input = document.getElementById('input');
const messages = document.getElementById('messages');
const displayNameEl = document.getElementById('display-name');
const editNameBtn = document.getElementById('edit-name');
const newGameBtn = document.getElementById('new-game');
const roomNameEl = document.getElementById('room-name');
const roomToggle = document.getElementById('room-toggle');
const roomMenu = document.getElementById('room-menu');
const roomSelect = document.getElementById('room-select');
const addRoomBtn = document.getElementById('add-room');
const imageBtn = document.getElementById('image-btn');
const imageInput = document.getElementById('image-input')
const reactionOptions = ['👍','❤️','😂','😮','😢','😡'];
roomMenu.style.display = 'none';

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
let userId = localStorage.getItem('userId');
if (!userId) {
  userId = crypto.randomUUID();
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

newGameBtn.onclick = () => {
  const list = Object.keys(games).join(', ');
  const game = prompt(`Start which game? (${list})`);
  if (game && games[game]) {
    socket.emit('start game', { game, user: { id: userId, name: username } });
  }
};

let currentRoom = localStorage.getItem('room') || 'general';
roomNameEl.textContent = currentRoom;

roomToggle.onclick = () => {
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

  const header = document.createElement('div');
  header.className = 'msg-header';
  const nameSpan = document.createElement('span');
  nameSpan.className = 'msg-user';
  nameSpan.textContent = msg.user.name;
  const timeSpan = document.createElement('span');
  timeSpan.className = 'msg-time';
  timeSpan.textContent = smartTime(msg.timestamp) + (msg.edited && !msg.deleted ? ' (edited)' : '');
  header.appendChild(nameSpan);
  header.appendChild(timeSpan);
  item.appendChild(header);

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
      body.appendChild(mod.render(msg.content, move => {
        socket.emit('game move', { id: msg.id, move, user: { id: userId, name: username } });
      }));
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
  item.appendChild(body);

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
    addBtn.innerHTML = '<i class="fa-regular fa-face-smile" aria-hidden="true"></i><span class="icon-fallback">React</span>';
    addBtn.onclick = e => {
      e.stopPropagation();
      showReactionMenu(msg.id, addBtn);
    };
    reactionsDiv.appendChild(addBtn);

    item.appendChild(reactionsDiv);
  }

  if (msg.user.id === userId && !msg.deleted) {
    if (msg.type === 'text') {
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
    }

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
