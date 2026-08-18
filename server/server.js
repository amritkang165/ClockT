const path = require('path');
const fs = require('fs');
const http = require('http');
const cors = require('cors');
const express = require('express');
const { Server } = require('socket.io');
const {
  games,
  generateCode,
  createRoom,
  playerIndex,
  applyMove,
  resetGame,
} = require('./game');

const PORT = process.env.PORT || 3001;

const app = express();
app.use(cors({ origin: true, credentials: true }));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: true, credentials: true } });

// Serve the compiled client if it exists (built via `npm run build`).
const dist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(path.join(dist, 'index.html'))) {
  app.use(express.static(dist));
  app.get('*', (req, res) => res.sendFile(path.join(dist, 'index.html')));
}

// ---------------------------------------------------------------------------
// In-memory state
// ---------------------------------------------------------------------------

const rooms = new Map(); // roomCode -> room

function snapshot(room, socketId) {
  const index = playerIndex(room, socketId);
  const game = games[room.game];
  return {
    code: room.code,
    game: room.game,
    turn: room.turn,
    winner: room.winner,
    yourIndex: index,
    names: room.names,
    opponentConnected: Boolean(room.players[0] && room.players[1]),
    ...game.snapshot(room, index),
  };
}

function emitGameState(room) {
  const ids = room.players.filter(Boolean);
  if (!ids.length) return;
  ids.forEach(id => io.to(id).emit('gameState', snapshot(room, id)));
}

// ---------------------------------------------------------------------------
// Socket handlers
// ---------------------------------------------------------------------------

io.on('connection', (socket) => {
  let joinedCode = null;

  const leaveRoom = (code) => {
    const room = rooms.get(code);
    if (!room) return;
    const index = room.players[0] === socket.id ? 0 : 1;
    const leavingName = room.names[index];
    room.players[index] = null;
    room.names[index] = null;
    joinedCode = null;

    const otherIndex = 1 - index;
    const other = room.players[otherIndex];

    if (!room.players[0] && !room.players[1]) {
      rooms.delete(code);
      return;
    }
    // If the departed player was on turn, hand the turn to the survivor
    // so they can keep playing / practice.
    if (room.turn === index && other) {
      room.turn = otherIndex;
    }
    if (other) {
      io.to(other).emit('gameState', snapshot(room, other));
      io.to(other).emit('opponentLeft', { name: leavingName });
    }
  };

  socket.on('createRoom', (name, gameId) => {
    if (joinedCode) return;
    const code = generateCode(rooms);
    const room = createRoom(code, socket.id, name, gameId);
    rooms.set(code, room);
    joinedCode = code;
    socket.join(code);
    socket.emit('roomCreated', { code, game: room.game, player: 'red' });
  });

  socket.on('joinRoom', (raw, name, gameId) => {
    if (joinedCode) return;
    const code = String(raw || '').trim().toUpperCase();
    const room = rooms.get(code);

    if (!room) {
      return socket.emit('error', { message: 'Room not found — the code may be wrong or too old.', fatal: true });
    }
    if (gameId && room.game !== gameId) {
      return socket.emit('error', { message: 'This room is playing a different game.', fatal: true });
    }
    // Release slots whose sockets are no longer actually connected (e.g. a
    // page reload whose old socket hasn't fired disconnect yet).
    for (let i = 0; i < room.players.length; i++) {
      const id = room.players[i];
      if (id && !io.sockets.sockets.get(id)) room.players[i] = null;
    }
    if (room.players[0] !== null && room.players[1] !== null) {
      return socket.emit('error', { message: 'This room is already full. Create your own game instead.', fatal: true });
    }
    if (room.players[0] === socket.id || room.players[1] === socket.id) {
      return socket.emit('error', { message: 'You are already in this room.', fatal: true });
    }

    const index = room.players[0] === null ? 0 : 1;
    room.players[index] = socket.id;
    room.names[index] = name || `Player ${index + 1}`;
    joinedCode = code;
    socket.join(code);
    socket.emit('gameState', snapshot(room, socket.id));
    emitGameState(room);
  });

  socket.on('makeMove', (action) => {
    if (!joinedCode) return;
    const room = rooms.get(joinedCode);
    if (!room) return;
    const res = applyMove(room, socket.id, action);
    if (!res.ok) {
      return socket.emit('error', { message: res.message, fatal: false });
    }
    emitGameState(room);
  });

  socket.on('nextRound', () => {
    if (!joinedCode) return;
    const room = rooms.get(joinedCode);
    if (!room || room.game !== 'rps') return;
    const st = room.state;
    if (!st.resolved) return;
    games.rps.nextRound(room);
    emitGameState(room);
  });

  socket.on('playAgain', () => {
    if (!joinedCode) return;
    const room = rooms.get(joinedCode);
    if (!room || !room.winner || !(room.players[0] && room.players[1])) return;
    resetGame(room);
    emitGameState(room);
  });

  socket.on('disconnect', () => {
    if (joinedCode) leaveRoom(joinedCode);
  });
});

server.listen(PORT, () => {
  console.log(`Connect 4 server listening on http://localhost:${PORT}`);
});
