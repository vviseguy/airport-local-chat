const socket = io();
const form = document.getElementById('form');
const input = document.getElementById('input');
const messages = document.getElementById('messages');
const changeNameBtn = document.getElementById('change-name');
const displayNameEl = document.getElementById('display-name');

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
  item.dataset.id = msg.id;
  const time = new Date(msg.timestamp).toLocaleTimeString();
  let content = msg.deleted ? 'Message removed' : msg.content;
  let text = `[${time}] ${msg.user.name}: ${content}`;
  if (msg.edited && !msg.deleted) {
    text += ' (edited)';
  }
  const span = document.createElement('span');
  span.textContent = text;
  item.appendChild(span);

  if (msg.user.id === userId && !msg.deleted) {
    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit';
    editBtn.onclick = () => {
      const newContent = prompt('Edit message', msg.content);
      if (newContent != null && newContent !== msg.content) {
        socket.emit('edit message', { id: msg.id, content: newContent, userId });
      }
    };
    item.appendChild(editBtn);

    const delBtn = document.createElement('button');
    delBtn.textContent = 'Delete';
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

socket.on('chat history', history => {
  messages.innerHTML = '';
  history.forEach(m => appendMessage(m));
});

socket.on('chat message', appendMessage);
socket.on('edit message', updateMessage);
socket.on('delete message', updateMessage);

form.addEventListener('submit', e => {
  e.preventDefault();
  if (input.value) {
    const msg = { user: { id: userId, name: username }, content: input.value };
    socket.emit('chat message', msg);
    input.value = '';
  }
});
