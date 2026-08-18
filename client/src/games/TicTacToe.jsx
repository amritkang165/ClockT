import { socket } from '../socket';

const SIZE = 3;

export default function TicTacToe({ state, myTurn, winnerKey }) {
  const { board, winCells, lastMove } = state;

  const wonCells = new Set(winCells.map(([r, c]) => `${r}-${c}`));

  const play = (r, c) => {
    if (myTurn && !board[r][c]) {
      socket.emit('makeMove', { row: r, col: c });
    }
  };

  return (
    <div className="game-panel">
      <div className="ttt-frame">
        <div className={`ttt-board ${myTurn ? '' : 'locked'}`}>
          {board.map((rowArr, r) =>
            rowArr.map((val, c) => (
              <div
                key={`${r}-${c}`}
                className={`ttt-cell ${
                  myTurn && !board[r][c] ? 'playable' : ''
                } ${
                  lastMove && lastMove.row === r && lastMove.col === c
                    ? 'just-played'
                    : ''
                }`}
                onClick={() => play(r, c)}
              >
                {val && (
                  <span
                    className={`ttt-mark ${val.toLowerCase()} ${
                      wonCells.has(`${r}-${c}`) ? 'won' : ''
                    }`}
                  >
                    {val}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}