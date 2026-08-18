const ROWS = 6;
const COLS = 7;
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateCode(rooms) {
  let code;
  do {
    code = Array.from(cryptoBytes(6))
      .map(b => CODE_ALPHABET[b % CODE_ALPHABET.length])
      .join('')
      .slice(0, 4);
  } while (rooms.has(code));
  return code;
}

const crypto = require('crypto');
function cryptoBytes(n) {
  return Array.from(crypto.randomBytes(n));
}

function emptyBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

function createRoom(code, playerId, name) {
  return {
    code,
    board: emptyBoard(),
    players: [playerId, null],
    names: [name || 'Player 1', null],
    turn: 0,
    winner: null,
    winCells: [],
    lastMove: null,
    moveCount: 0,
  };
}

function playerIndex(room, socketId) {
  return room.players[0] === socketId ? 0 : 1;
}

function findDropRow(board, col) {
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r][col] === null) return r;
  }
  return -1;
}

function findWinningCells(board, row, col, key) {
  const dirs = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ];
  for (const [dr, dc] of dirs) {
    const cells = [[row, col]];
    for (const s of [1, -1]) {
      let r = row + dr * s;
      let c = col + dc * s;
      while (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === key) {
        cells.push([r, c]);
        r += dr * s;
        c += dc * s;
      }
    }
    if (cells.length >= 4) return cells.slice(-4);
  }
  return null;
}

function applyMove(room, socketId, col) {
  if (!Number.isInteger(col) || col < 0 || col >= COLS) {
    return { ok: false, message: 'Invalid column.' };
  }
  if (room.winner) {
    return { ok: false, message: 'This game is already over.' };
  }
  const index = playerIndex(room, socketId);
  if (index !== room.turn) {
    return { ok: false, message: "It's not your turn." };
  }
  const row = findDropRow(room.board, col);
  if (row === -1) {
    return { ok: false, message: 'That column is full.' };
  }

  const key = index === 0 ? 'red' : 'yellow';
  room.board[row][col] = key;
  room.lastMove = { row, col };
  room.moveCount += 1;
  room.turn = 1 - room.turn;

  const winCells = findWinningCells(room.board, row, col, key);
  if (winCells) {
    room.winner = key;
    room.winCells = winCells;
  } else if (room.moveCount === ROWS * COLS) {
    room.winner = 'draw';
  }
  return { ok: true };
}

module.exports = {
  ROWS,
  COLS,
  generateCode,
  emptyBoard,
  createRoom,
  playerIndex,
  findDropRow,
  findWinningCells,
  applyMove,
};