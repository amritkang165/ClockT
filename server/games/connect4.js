const ROWS = 6;
const COLS = 7;

function emptyBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

function create() {
  return { board: emptyBoard(), winCells: [], lastMove: null, moveCount: 0 };
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

function applyMove(room, index, action) {
  const col = action;
  const st = room.state;
  if (room.winner) return { ok: false, message: 'This game is already over.' };
  if (!Number.isInteger(col) || col < 0 || col >= COLS) {
    return { ok: false, message: 'Invalid column.' };
  }
  if (index !== room.turn) {
    return { ok: false, message: "It's not your turn." };
  }
  const row = findDropRow(st.board, col);
  if (row === -1) {
    return { ok: false, message: 'That column is full.' };
  }

  const key = index === 0 ? 'red' : 'yellow';
  st.board[row][col] = key;
  st.lastMove = { row, col };
  st.moveCount += 1;
  room.turn = 1 - room.turn;

  const winCells = findWinningCells(st.board, row, col, key);
  if (winCells) {
    room.winner = key;
    st.winCells = winCells;
  } else if (st.moveCount === ROWS * COLS) {
    room.winner = 'draw';
  }
  return { ok: true };
}

function snapshot(room, index) {
  const st = room.state;
  return { board: st.board, winCells: st.winCells, lastMove: st.lastMove };
}

module.exports = {
  id: 'connect4',
  title: 'Connect 4',
  tagline: 'Drop discs, line up four',
  ROWS,
  COLS,
  create,
  applyMove,
  snapshot,
};
