const crypto = require('crypto');
const connect4 = require('./games/connect4');
const tictactoe = require('./games/tictactoe');
const rps = require('./games/rps');

const games = { connect4, tictactoe, rps };

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateCode(rooms) {
  let code;
  do {
    code = Array.from(crypto.randomBytes(6))
      .map(b => CODE_ALPHABET[b % CODE_ALPHABET.length])
      .join('')
      .slice(0, 4);
  } while (rooms.has(code));
  return code;
}

function createRoom(code, playerId, name, gameId) {
  const game = games[gameId] || games.connect4;
  return {
    code,
    game: game.id,
    players: [playerId, null],
    names: [name || 'Player 1', null],
    turn: 0,
    winner: null,
    state: game.create(),
  };
}

function playerIndex(room, socketId) {
  return room.players[0] === socketId ? 0 : 1;
}

function applyMove(room, socketId, action) {
  if (room.winner) {
    return { ok: false, message: 'This game is already over.' };
  }
  const index = playerIndex(room, socketId);
  return games[room.game].applyMove(room, index, action);
}

function resetGame(room) {
  room.state = games[room.game].create();
  room.turn = 0;
  room.winner = null;
}

module.exports = {
  games,
  generateCode,
  createRoom,
  playerIndex,
  applyMove,
  resetGame,
};
