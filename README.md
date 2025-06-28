# Airport Local Chat

Airport Local Chat is a lightweight local chat server you can run on a phone or laptop to keep friends in touch when there's no internet connection, e.g. while flying. It uses Node.js with Express and Socket.IO for real-time messaging and a very simple web interface.

## Features
- Single chat room with basic message history
- Edit or delete your own messages
- Chat persists across reconnects
- Runs entirely offline on local Wi-Fi

## Roadmap
- Multiple chat rooms
- Simple games to play together
- Reactions to messages with an unobtrusive UI

## Setup
1. Initialize the project:
   ```bash
   npm init -y
   npm install express socket.io uuid
   ```
2. Place the following files as shown:
   ```
   chat-server/
   ├── server.js
   └── public/
       ├── index.html
       └── chat.js
   ```
3. Start the server:
   ```bash
   node server.js
   ```
4. Connect to the server's IP address in your browser to join the chat.


