import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import confetti from 'canvas-confetti';
import { socket } from './socket';
import './styles.css';

export default function App() {
  const [screen, setScreen] = useState('landing');
  const [roomCode, setRoomCode] = useState('');
  const [myIndex, setMyIndex] = useState(0);
  const [turn, setTurn] = useState(0);
  const [board, setBoard] = useState(emptyBoard());
  const [winnerKey, setWinnerKey] = useState(null);
  const [winCells, setWinCells] = useState([]);
  const [lastMove, setLastMove] = useState(null);
  const [opponentConnected, setOpponentConnected] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [toast, setToast] = useState('');
  const [copied, setCopied] = useState(false);
  const [hoveredCol, setHoveredCol] = useState(-1);

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('room');
    if (code) {
      setRoomCode(code.toUpperCase());
      setScreen('joining');
      socket.emit('joinRoom', code);
    }
  }, []);

  useEffect(() => {
    const onRoomCreated = ({ code }) => {
      setRoomCode(code);
      setMyIndex(0);
      setTurn(0);
      setBoard(emptyBoard());
      setWinnerKey(null);
      setWinCells([]);
      setLastMove(null);
      setOpponentConnected(false);
      setScreen('waiting');
    };

    const onGameState = (state) => {
      setRoomCode(state.code);
      setMyIndex(state.yourIndex);
      setTurn(state.turn);
      setBoard(state.board);
      setWinnerKey(state.winner);
      setWinCells(state.winCells || []);
      setLastMove(state.lastMove);
      setOpponentConnected(state.opponentConnected);
      setScreen(state.winner ? 'over' : 'playing');
    };

    const onError = ({ message, fatal }) => {
      if (fatal) {
        setErrorMsg(message);
        setScreen('error');
      } else {
        setToast(message);
        window.setTimeout(() => setToast(''), 3000);
      }
    };

    const onOpponentLeft = () => {
      setOpponentConnected(false);
    };

    socket.on('roomCreated', onRoomCreated);
    socket.on('gameState', onGameState);
    socket.on('error', onError);
    socket.on('opponentLeft', onOpponentLeft);
    return () => {
      socket.off('roomCreated', onRoomCreated);
      socket.off('gameState', onGameState);
      socket.off('error', onError);
      socket.off('opponentLeft', onOpponentLeft);
    };
  }, []);

  useEffect(() => {
    if (winnerKey === 'red' || winnerKey === 'yellow') {
      const burst = () =>
        confetti({ particleCount: 130, spread: 90, origin: { y: 0.55 } });
      burst();
      const t = window.setTimeout(burst, 600);
      return () => window.clearTimeout(t);
    }
  }, [winnerKey]);

  const myKey = myIndex === 0 ? 'red' : 'yellow';
  const myTurn = turn === myIndex && !winnerKey;
  const shareLink = roomCode
    ? `${window.location.origin}${window.location.pathname}?room=${roomCode}`
    : '';
  const gameActive = screen === 'playing' || screen === 'over';

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const drop = (col) => {
    if (myTurn && board[0][col] === null) {
      socket.emit('makeMove', col);
    }
  };

  const goHome = () => {
    window.history.replaceState(null, '', window.location.pathname);
    setScreen('landing');
  };

  const statusText = !opponentConnected
    ? 'Waiting for opponent...'
    : winnerKey === 'draw'
      ? "It's a draw!"
      : winnerKey
        ? winnerKey === myKey
          ? 'You win!'
          : 'Opponent wins!'
        : myTurn
          ? 'Your turn'
          : 'Opponent\'s turn';

  const wonCells = useMemo(() => {
    return new Set(winCells.map(([r, c]) => `${r}-${c}`));
  }, [winCells]);

  return (
    <main className="app">
      {screen === 'landing' && (
        <section className="screen" key="landing">
          <div className="center-col">
            <h1 className="title">
              Connect<span className="title-accent">4</span>
            </h1>
            <p className="subtitle">
              Create a room, share the link, play with a friend.
            </p>
            <button className="btn btn-primary" onClick={() => socket.emit('createRoom')}>
              Create a game
            </button>

            <div className="board-preview">
              <div className="preview-grid">
                <div className="preview-cell" />
                <div className="preview-cell" />
                <div className="preview-cell" />
                <div className="preview-cell" />
                <div className="preview-cell" />
                <div className="preview-cell" />
                <div className="preview-cell" />
                <div className="preview-cell" />
                <div className="preview-cell red" />
                <div className="preview-cell" />
                <div className="preview-cell yellow" />
                <div className="preview-cell" />
                <div className="preview-cell" />
                <div className="preview-cell" />
                <div className="preview-cell" />
                <div className="preview-cell red" />
                <div className="preview-cell" />
                <div className="preview-cell yellow" />
                <div className="preview-cell red" />
                <div className="preview-cell" />
                <div className="preview-cell yellow" />
                <div className="preview-cell red" />
                <div className="preview-cell red" />
                <div className="preview-cell yellow" />
                <div className="preview-cell red" />
                <div className="preview-cell yellow" />
                <div className="preview-cell yellow" />
                <div className="preview-cell red" />
              </div>
            </div>

            <p className="meta">No sign-up &middot; Real-time &middot; Free</p>
          </div>
        </section>
      )}

      {screen === 'joining' && (
        <section className="screen" key="joining">
          <div className="card">
            <div className="spinner" />
            <p className="text-muted">Joining room...</p>
          </div>
        </section>
      )}

      {screen === 'error' && (
        <section className="screen" key="error">
          <div className="card">
            <div className="error-icon">!</div>
            <p className="text-bold">{errorMsg}</p>
            <button className="btn btn-primary" onClick={goHome}>
              Create a new game
            </button>
          </div>
        </section>
      )}

      {screen === 'waiting' && (
        <section className="screen" key="waiting">
          <div className="card">
            <p className="text-muted text-sm">Room created</p>
            <div className="room-code">{roomCode}</div>
            <p className="text-muted text-sm">Share this link with your opponent</p>
            <div className="link-row">
              <span className="link-text">{shareLink}</span>
              <button className="btn btn-sm" onClick={copyLink}>
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
            <div className="waiting">
              <div className="spinner small" />
              <span className="text-muted">Waiting for opponent...</span>
            </div>
          </div>
        </section>
      )}

      {gameActive && (
        <section className="screen" key="game">
          <div className="game">
            <header className="header">
              <span className="room-tag">Room {roomCode}</span>
              <div className="players">
                <div className={`player ${turn === 0 && !winnerKey ? 'active' : ''}`}>
                  <span className="chip red" />
                  <span>{myIndex === 0 ? 'You' : 'P1'}</span>
                </div>
                <span className="vs">vs</span>
                <div className={`player ${turn === 1 && !winnerKey ? 'active' : ''}`}>
                  <span className="chip yellow" />
                  <span>{myIndex === 1 ? 'You' : 'P2'}</span>
                </div>
              </div>
            </header>

            <div
              className={`board-frame ${myTurn ? 'your-turn' : ''}`}
              onMouseLeave={() => setHoveredCol(-1)}
            >
              <div className="hover-row">
                {Array.from({ length: 7 }, (_, c) => (
                  <div
                    key={c}
                    className={`hover-cell ${hoveredCol === c && myTurn && board[0][c] === null ? 'show' : ''}`}
                  >
                    <div className={`piece-preview ${myKey}`} />
                  </div>
                ))}
              </div>

              <div className="board">
                {board.map((rowArr, r) =>
                  rowArr.map((val, c) => (
                    <div
                      key={`${r}-${c}`}
                      className={`cell ${hoveredCol === c && myTurn ? 'col-hover' : ''} ${val ? 'filled' : ''}`}
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

              <p className="status">{statusText}</p>
              {!opponentConnected && (
                <p className="notice">Opponent disconnected</p>
              )}
              {toast && <div className="toast">{toast}</div>}

              {winnerKey && (
                <div className="overlay">
                  <div className="result">
                    <h2>
                      {winnerKey === 'draw'
                        ? "It's a draw!"
                        : winnerKey === myKey
                          ? 'You win!'
                          : 'You lose!'}
                    </h2>
                    <button
                      className="btn btn-primary"
                      onClick={() => socket.emit('playAgain')}
                    >
                      Play again
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

const ROWS = 6;
const COLS = 7;
function emptyBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}