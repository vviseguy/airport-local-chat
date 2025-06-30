# Airport Local Chat

Airport Local Chat is a lightweight local chat server you can run on a phone or laptop to keep friends in touch when there's no internet connection, e.g. while flying. It uses Node.js with Express and Socket.IO for real-time messaging and a very simple web interface.

## Features
- Single chat room with basic message history
- Edit or delete your own messages
- React to messages with emoji
- Chat persists across reconnects
- Runs entirely offline on local Wi-Fi
- Choose a display name that persists across refreshes

## Roadmap
- Multiple chat rooms
- Simple games to play together
- Reactions to messages with an unobtrusive UI

## User Stories

### Messaging

- **Send Messages**  
  As a traveler, I want to type a text message and send it to other nearby
  users so we can quickly coordinate plans.  
  *UI*: A main "Messages" pane displays a message input field and a send
  button.  
  *Flow*: Once sent, the message appears in the conversation thread with a
  timestamp and my username.

- **Read Messages**  
  As a user, I want to see incoming messages from others in a scrolling feed so
  I never miss updates.  
  *UI*: The thread scrolls upward; unread messages can be highlighted until I
  tap them.

### Pictures

- **Send Pictures**  
  As a traveler, I want to share photos (e.g., of our meeting spot) directly
  from my phone or laptop.
  *UI*: In the "Messages" pane, an image icon next to the Send button opens my file picker or camera.
  After selecting, a thumbnail preview appears before sending.

- **View Pictures**  
  As a user, I want to tap or click on images in the chat to see them
  full-size.  
  *UI*: Tapping an image opens a modal "Picture Viewer" pane with zoom controls
  and navigation arrows.

### Reactions and Message Management

- **React to Messages**  
  As a user, I want to quickly add emoji reactions to any message to show
  agreement or amusement.  
  *UI*: Click the smile icon next to a message and choose an emoji. Clicking the
  same emoji again removes your reaction. Hover over a reaction to see who added
  it.

- **Delete Messages**  
  As the sender, I want the ability to delete my own messages if I make a
  mistake or share something private.  
  *UI*: A "Delete" option appears in a message's context menu. Deleted messages
  remain as a small note like "Message removed" to preserve conversation flow.

- **Edit Messages**  
  As the sender, I want to edit a message after sending it to correct typos.  
  *UI*: An "Edit" icon next to my messages. After editing, the message shows an
  "edited" tag with the updated timestamp.

### Games

- **Start Games**  
  As a user, I want to initiate quick games with others to pass time while
  waiting for my flight.  
  *UI*: A "Games" pane or tab lists available titles (e.g., Trivia,
  Tic-Tac-Toe). Clicking a game opens a lobby.

- **Play Games**  
  As a player, I want a simple interface for multiplayer games within the chat
  window.  
  *UI*: The game board appears in a dedicated pane or overlay. When a game
  starts, new messages notify other participants. Scores update live.

### Connectivity

- **Reconnect or Refresh the Page**  
  As a user, I want the chat to resume automatically if I refresh the browser or
  briefly lose connection.  
  *UI*: On page reload, the app reconnects and fetches the latest chat history.
  A banner may announce "Reconnected" once back online.

- **Refresh the Server**  
  As an administrator or host, I want a simple way to restart the local server
  if something goes wrong.  
  *Flow*: A command-line or admin panel button performs a server reload. Users
  receive a short notice and the client attempts to reconnect automatically.

### Pane Layout Concept

- **Main Messages Pane** – central thread showing text and picture messages.
- **Sidebar or Tabs** – to switch between "Messages," "Games," or "Picture
  Gallery."
- **Modal Overlays** – for viewing pictures or editing messages.
- **Status Bar** – indicates network status, server refresh events, or ongoing
  games.

### Additional Needs

- **Set Nickname** – choose a display name when joining so others recognize you.
- **Join via QR Code** – hosts can show a QR code of the server address so
  phones connect quickly.

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
5. Messages are saved to `chat.json` so history remains after the server restarts.
6. Your chosen display name is stored in your browser so it stays after refreshes.

## Game API

Games are implemented as modules under `games/` and exposed to the client through matching files in `public/games/`. A game module must export three functions:

```
createGame(user)  // return initial game state object
applyMove(state, move, user)  // mutate state based on a player's move
summary(state)   // return a short text description of the current state
```

Server handlers call `createGame` when a game is started and `applyMove` for each move. The client imports the corresponding module to render boards and summaries. See `games/tictactoe.js` for a reference implementation.


