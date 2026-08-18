import { useEffect, useMemo, useState } from 'react';
import confetti from 'canvas-confetti';
import { socket } from './socket';
import './styles.css';

const ROWS = 6;
const COLS = 7;
function emptyBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

const PREVIEW_PIECES = [
  [3, 0, 'red'],
  [3, 1, 'red'],
  [2, 1, 'red'],
  [3, 2, 'yellow'],
  [3, 3, 'yellow'],
  [2, 3, 'red'],
  [1, 3, 'yellow'],
  [3, 4, 'red'],
  [3, 5, 'yellow'],
  [2, 5, 'yellow'],
  [2, 6, 'red'],
  [3, 6, 'yellow'],
];

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
          : 'You lose!'
        : myTurn
          ? 'Your turn — drop a disc'
          : 'Opponent is thinking...';

  const wonCells = useMemo(() => {
    return new Set(winCells.map(([r, c]) => `${r}-${c}`));
  }, [winCells]);

  const previewSet = useMemo(() => {
    const s = new Set();
    PREVIEW_PIECES.forEach(([r, c]) => s.add(`${r}-${c}`));
    return s;
  }, []);

  return (
    <main className="app">
      {screen === 'landing' && (
        <section className="screen" key="landing">
          <div className="logo" aria-hidden="true">
            <span className="logo-dot red" />
            <span className="logo-dot yellow" />
            <span className="logo-dot yellow" />
            <span className="logo-dot red" />
          </div>

          <h1 className="title">
            Connect<span className="title-accent">4</span>
          </h1>

          <p className="subtitle">
            The classic strategy game, reimagined for the modern web. Create a
            room, share the link, and play with a friend.
          </p>

          <button
            className="btn btn-primary"
            onClick={() => socket.emit('createRoom')}
          >
            Create a game
          </button>

          <div className="board-preview" aria-hidden="true">
            <div className="preview-grid">
              {Array.from({ length: 4 }, (_, r) =>
                Array.from({ length: 7 }, (_, c) => {
                  const key = `${r + 2}-${c}`;
                  const piece = PREVIEW_PIECES.find(
                    ([pr, pc]) => pr === r + 2 && pc === c
                  );
                  return (
                    <div
                      key={key}
                      className={`preview-cell ${piece ? piece[2] : ''}`}
                    />
                  );
                })
              )}
            </div>
          </div>

          <p className="meta">No sign-up · Real-time · Free</p>
        </section>
      )}

      {screen === 'joining' && (
        <section className="screen" key="joining">
          <div className="card">
            <div className="spinner" />
            <p className="text-bold">Joining room...</p>
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
            <p className="card-title">Room created</p>
            <div className="room-code">{roomCode}</div>
            <p className="card-title">
              Share this link with your opponent
            </p>
            <div className="link-row">
              <span className="link-text">{shareLink}</span>
              <button className="btn btn-secondary" onClick={copyLink}>
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
            <div className="waiting">
              <div className="spinner sm" />
              <span>Waiting for opponent to join...</span>
            </div>
          </div>
        </section>
      )}

      {gameActive && (
        <section className="screen" key="game">
          <div className="game">
            <header className="header">
              <div className="header-left">
                <span className="room-tag">Room {roomCode}</span>
                <button className="btn-icon" onClick={goHome} title="Leave room">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                </button>
              </div>
              <div className="players">
                <div
                  className={`player ${
                    turn === 0 && !winnerKey ? 'active' : ''
                  }`}
                >
                  <span className="chip red" />
                  <span>{myIndex === 0 ? 'You' : 'Player 1'}</span>
                </div>
                <span className="vs">vs</span>
                <div
                  className={`player ${
                    turn === 1 && !winnerKey ? 'active' : ''
                  }`}
                >
                  <span className="chip yellow" />
                  <span>{myIndex === 1 ? 'You' : 'Player 2'}</span>
                </div>
              </div>
            </header>

            <div className="board-wrap">
              <div
                className={`board-frame ${
                  myTurn && !winnerKey ? 'your-turn' : ''
                }`}
                onMouseLeave={() => setHoveredCol(-1)}
              >
                <div className="hover-row">
                  {Array.from({ length: COLS }, (_, c) => (
                    <div
                      key={c}
                      className={`hover-cell ${
                        hoveredCol === c &&
                        myTurn &&
                        board[0][c] === null
                          ? 'show'
                          : ''
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
                          hoveredCol === c && myTurn && !val
                            ? 'col-hover'
                            : ''
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
                            } ${
                              wonCells.has(`${r}-${c}`) ? 'won' : ''
                            }`}
                            style={
                              lastMove &&
                              lastMove.row === r &&
                              lastMove.col === c
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

              <p className="status">{statusText}</p>
              {!opponentConnected && (
                <p className="notice">Opponent disconnected</p>
              )}
              {toast && <div className="toast">{toast}</div>}

              {winnerKey && (
                <div className="overlay">
                  <div className="result">
                    <div
                      className={`result-icon ${
                        winnerKey === 'draw'
                          ? 'draw'
                          : winnerKey === myKey
                            ? 'win'
                            : 'lose'
                      }`}
                    >
                      {winnerKey === 'draw'
                        ? '='
                        : winnerKey === myKey
                          ? '✓'
                          : '✗'}
                    </div>
                    <h2>
                      {winnerKey === 'draw'
                        ? "It's a draw!"
                        : winnerKey === myKey
                          ? 'You win!'
                          : 'You lose!'}
                    </h2>
                    <p>
                      {winnerKey === 'draw'
                        ? 'No more moves available.'
                        : 'Nice 4-in-a-row!'}
                    </p>
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