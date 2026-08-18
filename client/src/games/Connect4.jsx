import { useState } from 'react';
import { socket } from '../socket';

const ROWS = 6;
const COLS = 7;

export default function Connect4({ state, myIndex, myKey, myTurn, winnerKey }) {
  const [hoveredCol, setHoveredCol] = useState(-1);
  const { board, winCells, lastMove } = state;

  const wonCells = new Set(winCells.map(([r, c]) => `${r}-${c}`));

  const drop = (col) => {
    if (myTurn && board[0][col] === null) {
      socket.emit('makeMove', col);
    }
  };

  return (
    <div className="game-panel">
      <div
        className={`board-frame ${myTurn && !winnerKey ? 'your-turn' : ''}`}
        onMouseLeave={() => setHoveredCol(-1)}
      >
        <div className="hover-row">
          {Array.from({ length: COLS }, (_, c) => (
            <div
              key={c}
              className={`hover-cell ${
                hoveredCol === c && myTurn && board[0][c] === null ? 'show' : ''
              }`}
            >
              <div className={`piece-preview ${myKey}`} />
            </div>
          ))}
        </div>

        <div className={`board ${myTurn ? '' : 'locked'}`}>
          {board.map((rowArr, r) =>
            rowArr.map((val, c) => (
              <div
                key={`${r}-${c}`}
                className={`cell ${
                  hoveredCol === c && myTurn && !val ? 'col-hover' : ''
                } ${val ? 'filled' : ''}`}
                onMouseEnter={() => setHoveredCol(c)}
                onClick={() => drop(c)}
              >
                {val && (
                  <div
                    className={`piece ${val} ${
                      lastMove &&
                      lastMove.row === r &&
                      lastMove.col === c &&
                      !wonCells.has(`${r}-${c}`)
                        ? 'drop-in'
                        : ''
                    } ${wonCells.has(`${r}-${c}`) ? 'won' : ''}`}
                    style={
                      lastMove && lastMove.row === r && lastMove.col === c
                        ? { '--row': r }
                        : undefined
                    }
                  />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
