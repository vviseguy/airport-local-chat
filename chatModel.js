const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

class Message {
  constructor({
    id = uuidv4(),
    user = { id: uuidv4(), name: 'anon' },
    content = '',
    type = 'text',
    timestamp = Date.now(),
    edited = false,
    deleted = false
  } = {}) {
    this.id = id;
    this.user = user; // {id, name}
    this.content = content; // string representation for text, image path, or game ref
    this.type = type; // 'text', 'image', 'game', etc.
    this.timestamp = timestamp;
    this.edited = edited;
    this.deleted = deleted;
  }
}

class Chat {
  constructor(path) {
    this.path = path || 'chat.json';
    this.messages = [];
    this.load();
  }

  load() {
    try {
      const data = fs.readFileSync(this.path, 'utf-8');
      const parsed = JSON.parse(data);
      this.messages = parsed.messages.map(m => new Message(m));
    } catch (err) {
      this.messages = [];
    }
  }

  save() {
    const data = JSON.stringify({ messages: this.messages }, null, 2);
    fs.writeFileSync(this.path, data);
  }

  addMessage(msg) {
    const message = msg instanceof Message ? msg : new Message(msg);
    this.messages.push(message);
    this.save();
    return message;
  }

  editMessage(id, newContent) {
    const msg = this.messages.find(m => m.id === id && !m.deleted);
    if (msg) {
      msg.content = newContent;
      msg.edited = true;
      msg.timestamp = Date.now();
      this.save();
    }
    return msg;
  }

  deleteMessage(id) {
    const msg = this.messages.find(m => m.id === id && !m.deleted);
    if (msg) {
      msg.deleted = true;
      msg.content = 'Message removed';
      this.save();
    }
    return msg;
  }

  toJSON() {
    return { messages: this.messages };
  }
}

module.exports = { Message, Chat };
