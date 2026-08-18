# Connect 4 Online

A real-time multiplayer Connect 4 game built with React, Socket.io, and Express.

## Features

- **Real-time multiplayer** — Play with a friend using WebSocket connections
- **Shareable links** — Create a room and share the link to invite your opponent
- **No sign-up required** — Just create a game and start playing
- **Responsive design** — Works on desktop and mobile
- **Win detection** — Automatic detection of 4-in-a-row wins and draws
- **Play again** — Rematch functionality after a game ends

## Tech Stack

- **Frontend:** React 18, Vite
- **Backend:** Node.js, Express, Socket.io
- **Styling:** CSS with gradients, animations, and glass effects

## Getting Started

### Prerequisites

- Node.js 18+ installed

### Installation

```bash
# Install all dependencies
npm run install:all
```

### Development

```bash
# Start both server and client in dev mode
npm run dev
```

- Client: http://localhost:5173

### Production

```bash
npm run build && npm start
```

- Server (has built client baked in): http://localhost:3001

## Deployment (free, stable URL)

Two deploy-ready files are included: `render.yaml` (Render Blueprint) and a
`Procfile`.

**Render** (recommended — free tier)

1. Push this repo to GitHub
2. Go to https://render.com and sign up (free)
3. Dashboard → **New** → **Blueprint**
4. Connect your GitHub repo (`connect4-online`)
5. Render reads `render.yaml`, provisions the service, runs
   `npm install && npm run build`, and starts it
6. You get a stable URL like `https://connect4-online.onrender.com`

Notes:

- Share links in the app use the site's own origin (no config needed).
- The free-tier service sleeps after ~15 min idle and wakes on the first request.
- No `.env` needed in production; `VITE_PUBLIC_URL` is only for local dev with a
  tunnel.
- Server: http://localhost:3001

### Production Build

```bash
# Build the client
npm run build

# Start the server (serves the built client)
npm start
```

## How to Play

1. Click **Create a game** to start a new room
2. Share the link with your friend
3. Player 1 plays Red, Player 2 plays Yellow
4. Take turns dropping discs into columns
5. First to connect 4 in a row (horizontal, vertical, or diagonal) wins!

## Project Structure

```
ClockT/
├── client/          # React frontend
│   ├── src/
│   │   ├── App.jsx      # Main game component
│   │   ├── styles.css   # All styling
│   │   ├── main.jsx     # React entry point
│   │   └── socket.js    # Socket.io client
│   ├── index.html
│   └── vite.config.js
├── server/          # Node.js backend
│   ├── game.js      # Game logic (board, win detection)
│   └── server.js    # Express + Socket.io server
└── package.json     # Root scripts
```

## License

MIT
