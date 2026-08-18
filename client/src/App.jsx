import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { socket } from './socket';
import { GAMES, gameTitle } from './games/registry';
import Connect4 from './games/Connect4';
import TicTacToe from './games/TicTacToe';
import Rps from './games/Rps';
import './styles.css';

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

function GameIcon({ icon }) {
  if (icon === 'c4') {
    return (
      <div className="gicon c4" aria-hidden="true">
        <span className="gdot red" />
        <span className="gdot yellow" />
        <span className="gdot yellow" />
        <span className="gdot red" />
      </div>
    );
  }
  if (icon === 'ttt') {
    return (
      <div className="gicon ttt" aria-hidden="true">
        <span>X</span>
        <span />
        <span>O</span>
        <span />
        <span className="mid">X</span>
        <span />
        <span>O</span>
        <span />
        <span>X</span>
      </div>
    );
  }
  return (
    <div className="gicon rps" aria-hidden="true">
      <span className="gdot red" />
      <span className="gdot yellow" />
      <span className="gdot red" />
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState('landing');
  const [roomCode, setRoomCode] = useState('');
  const [game, setGame] = useState('connect4');
  const [state, setState] = useState(null);
  const [myName, setMyName] = useState('');
  const [names, setNames] = useState(['Player 1', 'Player 2']);
  const [errorMsg, setErrorMsg] = useState('');
  const [toast, setToast] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('room');
    const name = params.get('name');
    const gameParam = params.get('game');
    if (gameParam && GAMES.some(g => g.id === gameParam)) {
      setGame(gameParam);
    }
    if (code) {
      setRoomCode(code.toUpperCase());
      if (name) setMyName(name);
      setScreen('joining');
    }
  }, []);

  useEffect(() => {
    const onRoomCreated = ({ code, game: g }) => {
      setRoomCode(code);
      setGame(g || 'connect4');
      setState(null);
      setNames([myName || 'Player 1', 'Player 2']);
      setToast('');
      setScreen('waiting');
    };

    const onGameState = (snap) => {
      setRoomCode(snap.code);
      setGame(snap.game);
      setNames(snap.names || names);
      setState(snap);
      setToast('');
      setScreen(snap.winner ? 'over' : 'playing');
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

    const onOpponentLeft = ({ name }) => {
      setToast(`${name || 'Opponent'} left the game`);
      window.setTimeout(() => setToast(''), 4000);
      if (state && state.game === 'rps') {
        return;
      }
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
  }, [myName, names]);

  const winnerKey = state ? state.winner : null;

  useEffect(() => {
    if (winnerKey === 'red' || winnerKey === 'yellow') {
      const burst = () =>
        confetti({ particleCount: 130, spread: 90, origin: { y: 0.55 } });
      burst();
      const t = window.setTimeout(burst, 600);
      return () => window.clearTimeout(t);
    }
  }, [winnerKey]);

  const myIndex = state ? state.yourIndex : 0;
  const myKey = myIndex === 0 ? 'red' : 'yellow';
  const myTurn = state ? state.turn === myIndex && !winnerKey : false;
  const opponentConnected = state ? state.opponentConnected : false;
  const displayName = (idx) => names[idx] || `Player ${idx + 1}`;

  const shareLink = roomCode
    ? `${window.location.origin}${window.location.pathname}?room=${roomCode}&game=${game}&name=${encodeURIComponent(names[1] || 'Player 2')}`
    : '';
  const gameActive = screen === 'playing' || screen === 'over';

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const goHome = () => {
    window.history.replaceState(null, '', window.location.pathname);
    setScreen('landing');
    setState(null);
    setRoomCode('');
    setMyName('');
  };

  const handleCreate = () => {
    socket.emit('createRoom', myName.trim() || undefined, game);
  };

  const handleJoin = () => {
    socket.emit('joinRoom', roomCode, myName.trim() || undefined, game);
  };

  let status = '';
  if (gameActive && state) {
    if (!opponentConnected) {
      status = 'Waiting for opponent...';
    } else if (winnerKey === 'draw') {
      status = "It's a draw!";
    } else if (winnerKey) {
      status = winnerKey === myKey ? 'You win!' : 'You lose!';
    } else if (myTurn) {
      status = game === 'rps' ? 'Pick your move' : 'Your turn';
    } else {
      status = game === 'rps'
        ? 'Waiting for opponent...'
        : `${displayName(myIndex === 0 ? 1 : 0)}'s turn`;
    }
  }

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
            Game<span className="title-accent">Hub</span>
          </h1>

          <p className="subtitle">
            Pick a game, create a room, share the link, and play with a friend
            in real time.
          </p>

          <div className="game-picker">
            {GAMES.map(g => (
              <button
                key={g.id}
                className={`game-card ${game === g.id ? 'selected' : ''}`}
                onClick={() => setGame(g.id)}
              >
                <GameIcon icon={g.icon} />
                <span className="game-card-title">{g.title}</span>
                <span className="game-card-tagline">{g.tagline}</span>
              </button>
            ))}
          </div>

          <div className="name-input-row landing-name">
            <input
              type="text"
              className="name-input"
              placeholder="Enter your name"
              value={myName}
              onChange={(e) => setMyName(e.target.value)}
              maxLength={20}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
          </div>

          <button className="btn btn-primary" onClick={handleCreate}>
            Create a {gameTitle(game)} game
          </button>

          <div className="board-preview" aria-hidden="true">
            <div className="preview-grid">
              {Array.from({ length: 4 }, (_, r) =>
                Array.from({ length: 7 }, (_, c) => {
                  const piece = PREVIEW_PIECES.find(
                    ([pr, pc]) => pr === r + 2 && pc === c
                  );
                  return (
                    <div
                      key={`${r + 2}-${c}`}
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
            <p className="card-title">Join {gameTitle(game)} game</p>
            <div className="name-input-row">
              <input
                type="text"
                className="name-input"
                placeholder="Enter your name"
                value={myName}
                onChange={(e) => setMyName(e.target.value)}
                maxLength={20}
                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                autoFocus
              />
            </div>
            <button className="btn btn-primary" onClick={handleJoin}>
              Join game
            </button>
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
            <p className="card-title">{gameTitle(game)} · Room created</p>
            <div className="room-code">{roomCode}</div>
            <p className="card-title">Share this link with your opponent</p>
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

      {gameActive && state && (
        <section className="screen" key="game">
          <div className="game">
            <header className="header">
              <div className="header-left">
                <span className="room-tag">{gameTitle(game)} · {roomCode}</span>
                <button className="btn-icon" onClick={goHome} title="Leave room">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                </button>
              </div>
              <div className="players">
                <div className={`player ${state.turn === 0 && !winnerKey ? 'active' : ''}`}>
                  <span className="chip red" />
                  <span>{myIndex === 0 ? `${myName || 'You'} (You)` : displayName(0)}</span>
                </div>
                <span className="vs">vs</span>
                <div className={`player ${state.turn === 1 && !winnerKey ? 'active' : ''}`}>
                  <span className="chip yellow" />
                  <span>{myIndex === 1 ? `${myName || 'You'} (You)` : displayName(1)}</span>
                </div>
              </div>
            </header>

            <div className="game-area">
              {game === 'connect4' && (
                <Connect4
                  state={state}
                  myIndex={myIndex}
                  myKey={myKey}
                  myTurn={myTurn}
                  winnerKey={winnerKey}
                />
              )}
              {game === 'tictactoe' && (
                <TicTacToe
                  state={state}
                  myTurn={myTurn}
                  winnerKey={winnerKey}
                />
              )}
              {game === 'rps' && (
                <Rps
                  state={state}
                  myIndex={myIndex}
                  myKey={myKey}
                  myName={myName}
                  names={names}
                  winnerKey={winnerKey}
                />
              )}

              <p className="status">{status}</p>
              {!opponentConnected && (
                <p className="notice">Opponent disconnected</p>
              )}

              {winnerKey && game !== 'rps' && (
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
                          ? '\u2713'
                          : '\u2717'}
                    </div>
                    <h2>
                      {winnerKey === 'draw'
                        ? "It's a draw!"
                        : winnerKey === myKey
                          ? `${myName || 'You'} win!`
                          : `${displayName(myIndex === 0 ? 1 : 0)} wins!`}
                    </h2>
                    <p>
                      {winnerKey === 'draw'
                        ? 'No more moves available.'
                        : 'Nice play!'}
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

            {toast && <div className="toast">{toast}</div>}
          </div>
        </section>
      )}
    </main>
  );
}