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
    deleted = false,
    reactions = {}
  } = {}) {
    this.id = id;
    this.user = user; // {id, name}
    this.content = content; // string representation for text, image path, or game ref
    this.type = type; // 'text', 'image', 'game', etc.
    this.timestamp = timestamp;
    this.edited = edited;
    this.deleted = deleted;
    this.reactions = reactions; // {emoji: [{id,name}]}
  }
}

class Chat {
  constructor(path) {
    this.path = path || 'chat.json';
    this.rooms = { general: [] };
    this.load();
  }

  load() {
    try {
      const data = fs.readFileSync(this.path, 'utf-8');
      const parsed = JSON.parse(data);
      if (parsed.rooms) {
        this.rooms = {};
        for (const [room, msgs] of Object.entries(parsed.rooms)) {
          this.rooms[room] = msgs.map(m => new Message(m));
        }
      } else if (parsed.messages) {
        this.rooms = { general: parsed.messages.map(m => new Message(m)) };
      }
    } catch (err) {
      this.rooms = { general: [] };
    }
  }

  save() {
    const serialised = {};
    serialised.rooms = {};
    for (const [room, msgs] of Object.entries(this.rooms)) {
      serialised.rooms[room] = msgs;
    }
    fs.writeFileSync(this.path, JSON.stringify(serialised, null, 2));
  }

  ensureRoom(room) {
    if (!this.rooms[room]) {
      this.rooms[room] = [];
    }
  }

  listRooms() {
    return Object.keys(this.rooms);
  }

  getMessages(room = 'general') {
    this.ensureRoom(room);
    return this.rooms[room];
  }

  addMessage(room, msg) {
    this.ensureRoom(room);
    const message = msg instanceof Message ? msg : new Message(msg);
    this.rooms[room].push(message);
    this.save();
    return message;
  }

  editMessage(room, id, newContent) {
    this.ensureRoom(room);
    const msg = this.rooms[room].find(m => m.id === id && !m.deleted);
    if (msg) {
      msg.content = newContent;
      msg.edited = true;
      msg.timestamp = Date.now();
      this.save();
    }
    return msg;
  }

  deleteMessage(room, id) {
    this.ensureRoom(room);
    const msg = this.rooms[room].find(m => m.id === id && !m.deleted);
    if (msg) {
      msg.deleted = true;
      msg.content = 'Message removed';
      this.save();
    }
    return msg;
  }

  toggleReaction(room, id, emoji, user) {
    this.ensureRoom(room);
    const msg = this.rooms[room].find(m => m.id === id && !m.deleted);
    if (!msg) return null;
    if (!msg.reactions[emoji]) {
      msg.reactions[emoji] = [];
    }
    const exists = msg.reactions[emoji].find(u => u.id === user.id);
    if (exists) {
      msg.reactions[emoji] = msg.reactions[emoji].filter(u => u.id !== user.id);
      if (msg.reactions[emoji].length === 0) delete msg.reactions[emoji];
    } else {
      msg.reactions[emoji].push(user);
    }
    this.save();
    return msg;
  }

  toJSON() {
    return { rooms: this.rooms };
  }
}

module.exports = { Message, Chat };
