const socket = io();
const form = document.getElementById('form');
const input = document.getElementById('input');
const messages = document.getElementById('messages');
const changeNameBtn = document.getElementById('change-name');
const displayNameEl = document.getElementById('display-name');
const reactionOptions = ['👍','❤️','😂','😮','😢','😡'];

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
displayNameEl.textContent = `Name: ${username}`;
changeNameBtn.onclick = () => {
  const newName = prompt('Enter new display name', username);
  if (newName) {
    username = newName;
    localStorage.setItem('username', username);
    displayNameEl.textContent = `Name: ${username}`;
  }
};

function renderMessage(msg) {
  const item = document.createElement('li');
  item.className = 'msg';
  if (msg.user.id === userId) item.classList.add('self');
  item.dataset.id = msg.id;

  const meta = document.createElement('div');
  meta.className = 'meta';
  const content = msg.deleted ? 'Message removed' : msg.content;
  meta.innerHTML = `<strong>${msg.user.name}:</strong> <span class="text">${content}</span> <span class="time">${smartTime(msg.timestamp)}</span>${msg.edited && !msg.deleted ? ' <em>(edited)</em>' : ''}`;
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

  if (msg.user.id === userId && !msg.deleted) {
    const editBtn = document.createElement('button');
    editBtn.className = 'icon-button';
    editBtn.innerHTML = '<i class="fa-regular fa-pen-to-square" aria-hidden="true"></i><span class="icon-fallback">Edit</span>';
    editBtn.onclick = () => {
      const newContent = prompt('Edit message', msg.content);
      if (newContent != null && newContent !== msg.content) {
        socket.emit('edit message', { id: msg.id, content: newContent, userId });
      }
    };
    item.appendChild(editBtn);

    const delBtn = document.createElement('button');
    delBtn.className = 'icon-button';
    delBtn.innerHTML = '<i class="fa-regular fa-trash-can" aria-hidden="true"></i><span class="icon-fallback">Delete</span>';
    delBtn.onclick = () => {
      if (confirm('Delete this message?')) {
        socket.emit('delete message', { id: msg.id, userId });
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
      socket.emit('reaction', { id: messageId, emoji, user: { id: userId, name: username } });
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

form.addEventListener('submit', e => {
  e.preventDefault();
  if (input.value) {
    const msg = { user: { id: userId, name: username }, content: input.value };
    socket.emit('chat message', msg);
    input.value = '';
  }
});
