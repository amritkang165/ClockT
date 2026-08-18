const SIZE = 3;

function emptyBoard() {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
}

function create() {
  return { board: emptyBoard(), winCells: [], lastMove: null, moveCount: 0 };
}

function findWin(board, row, col, key) {
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
      while (r >= 0 && r < SIZE && c >= 0 && c < SIZE && board[r][c] === key) {
        cells.push([r, c]);
        r += dr * s;
        c += dc * s;
      }
    }
    if (cells.length >= SIZE) return cells.slice(-SIZE);
  }
  return null;
}

function applyMove(room, index, action) {
  const st = room.state;
  if (room.winner) return { ok: false, message: 'This game is already over.' };
  if (index !== room.turn) {
    return { ok: false, message: "It's not your turn." };
  }
  if (!action || !Number.isInteger(action.row) || !Number.isInteger(action.col)) {
    return { ok: false, message: 'Invalid move.' };
  }
  const { row, col } = action;
  if (row < 0 || row >= SIZE || col < 0 || col >= SIZE) {
    return { ok: false, message: 'Out of bounds.' };
  }
  if (st.board[row][col]) {
    return { ok: false, message: 'That cell is already taken.' };
  }

  const key = index === 0 ? 'X' : 'O';
  st.board[row][col] = key;
  st.lastMove = { row, col };
  st.moveCount += 1;
  room.turn = 1 - room.turn;

  const winCells = findWin(st.board, row, col, key);
  if (winCells) {
    room.winner = key;
    st.winCells = winCells;
  } else if (st.moveCount === SIZE * SIZE) {
    room.winner = 'draw';
  }
  return { ok: true };
}

function snapshot(room, index) {
  const st = room.state;
  return { board: st.board, winCells: st.winCells, lastMove: st.lastMove };
}

module.exports = {
  id: 'tictactoe',
  title: 'Tic-Tac-Toe',
  tagline: 'Get three in a row',
  SIZE,
  create,
  applyMove,
  snapshot,
};
