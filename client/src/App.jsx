import { useEffect, useRef, useState } from 'react';
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

const HERO_DISCS = [
  { left: '6%', size: 22, color: 'red', dur: 9, delay: 0 },
  { left: '15%', size: 12, color: 'yellow', dur: 12, delay: 2 },
  { left: '27%', size: 30, color: 'yellow', dur: 10, delay: 1 },
  { left: '40%', size: 14, color: 'red', dur: 13, delay: 3.5 },
  { left: '55%', size: 26, color: 'red', dur: 9.5, delay: 0.8 },
  { left: '68%', size: 16, color: 'yellow', dur: 12, delay: 2.8 },
  { left: '80%', size: 24, color: 'yellow', dur: 10.5, delay: 1.6 },
  { left: '90%', size: 12, color: 'red', dur: 11, delay: 0.4 },
];

const MARQUEE_ITEMS = ['Connect 4', 'Tic-Tac-Toe', 'Rock Paper Scissors', 'Real-time', 'Play with friends', 'No sign-up'];

const HOW_STEPS = [
  { n: '01', title: 'Pick a game', text: 'Choose Connect 4, Tic-Tac-Toe, or Rock Paper Scissors.' },
  { n: '02', title: 'Share the link', text: 'Create a room and send the invite link to a friend.' },
  { n: '03', title: 'Play live', text: 'Moves sync instantly over WebSockets. Good luck.' },
];

// Public origin used in share links so invites never point at localhost, even
// when the app is being viewed locally. Set VITE_PUBLIC_URL in client/.env to
// override; when unset (e.g. production builds) it falls back to the site's
// own origin.
const PUBLIC_ORIGIN =
  (import.meta.env.VITE_PUBLIC_URL || '').replace(/\/$/, '') ||
  window.location.origin;

function Reveal({ as: Tag = 'div', delay = 0, className = '', children }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            el.classList.add('revealed');
            io.unobserve(el);
          }
        });
      },
      { threshold: 0.18 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Tag
      ref={ref}
      className={`reveal ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}

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
    ? `${PUBLIC_ORIGIN}?room=${roomCode}&game=${game}&name=${encodeURIComponent(names[1] || 'Player 2')}`
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

  const scrollToPlay = () => {
    document.getElementById('play')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <main className={`app ${screen === 'landing' ? 'home' : ''}`}>
      {screen === 'landing' && (
        <section className="screen home" key="landing">
          <nav className="navbar">
            <a className="brand" href="#top" onClick={(e) => { e.preventDefault(); scrollTo('top'); }}>
              <span className="logo-mini" aria-hidden="true">
                <span className="logo-dot red" />
                <span className="logo-dot yellow" />
              </span>
              ClockT
            </a>
            <div className="nav-links">
              <a href="#games" onClick={(e) => { e.preventDefault(); scrollTo('games'); }}>Games</a>
              <a href="#how" onClick={(e) => { e.preventDefault(); scrollTo('how'); }}>How it works</a>
              <a className="nav-play" href="#play" onClick={(e) => { e.preventDefault(); scrollTo('play'); }}>Play now</a>
            </div>
          </nav>

          <header className="hero" id="top">
            <div className="hero-grid" aria-hidden="true" />
            <div className="hero-discs" aria-hidden="true">
              {HERO_DISCS.map((d, i) => (
                <span
                  key={i}
                  className={`hero-disc ${d.color}`}
                  style={{
                    left: d.left,
                    width: d.size,
                    height: d.size,
                    animationDuration: `${d.dur}s`,
                    animationDelay: `${d.delay}s`,
                  }}
                />
              ))}
            </div>
            <div className="hero-inner">
              <Reveal delay={60}>
                <p className="kicker">Real-time multiplayer rooms</p>
              </Reveal>
              <Reveal delay={140}>
                <h1 className="title">
                  Play <span className="title-accent">ClockT</span> games<br />
                  with friends.
                </h1>
              </Reveal>
              <Reveal delay={240}>
                <p className="subtitle">
                  Three classics. One shared room. No sign-up — create a game,
                  send the link, and start playing instantly.
                </p>
              </Reveal>
              <Reveal delay={340}>
                <div className="hero-cta">
                  <button className="btn btn-primary" onClick={scrollToPlay}>
                    Create a game
                  </button>
                  <button className="btn btn-ghost" onClick={() => scrollTo('how')}>
                    How it works
                  </button>
                </div>
              </Reveal>
            </div>
          </header>

          <div className="marquee" aria-hidden="true">
            <div className="marquee-track">
              {[0, 1].map((k) => (
                <div className="marquee-set" key={k}>
                  {MARQUEE_ITEMS.map((t) => (
                    <span className="marquee-item" key={`${k}-${t}`}>
                      <span className="marquee-dot" />
                      {t}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <section className="section games-section" id="games">
            <Reveal>
              <p className="kicker">The games</p>
            </Reveal>
            <Reveal delay={80}>
              <h2 className="section-title">Choose your battleground</h2>
            </Reveal>
            <div className="game-grid">
              {GAMES.map((g, i) => (
                <Reveal key={g.id} delay={i * 90}>
                  <button
                    className={`game-card big ${game === g.id ? 'selected' : ''}`}
                    onClick={() => setGame(g.id)}
                  >
                    <span className="game-card-top">
                      <span className="game-card-num">0{i + 1}</span>
                      {game === g.id && <span className="game-card-selected">Selected</span>}
                    </span>
                    <GameIcon icon={g.icon} />
                    <span className="game-card-title">{g.title}</span>
                    <span className="game-card-tagline">{g.tagline}</span>
                    <span className="game-card-arrow">&#8594;</span>
                  </button>
                </Reveal>
              ))}
            </div>
          </section>

          <section className="section how-section" id="how">
            <Reveal>
              <p className="kicker">How it works</p>
            </Reveal>
            <Reveal delay={80}>
              <h2 className="section-title">Live in three steps</h2>
            </Reveal>
            <div className="how-grid">
              {HOW_STEPS.map((s, i) => (
                <Reveal key={s.n} delay={i * 100}>
                  <div className="how-card">
                    <span className="how-num">{s.n}</span>
                    <h3>{s.title}</h3>
                    <p>{s.text}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </section>

          <section className="section play-section" id="play">
            <Reveal>
              <p className="kicker">Ready when you are</p>
            </Reveal>
            <Reveal delay={80}>
              <h2 className="section-title">Start a room — it&apos;s free</h2>
            </Reveal>
            <Reveal delay={160}>
              <div className="play-box">
                <div className="play-form">
                  <p className="play-selected">
                    Playing: <b className="play-game">{gameTitle(game)}</b>
                  </p>
                  <div className="cta-row">
                    <input
                      type="text"
                      className="name-input"
                      placeholder="Enter your name"
                      value={myName}
                      onChange={(e) => setMyName(e.target.value)}
                      maxLength={20}
                      onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                    />
                    <button className="btn btn-primary" onClick={handleCreate}>
                      Create a {gameTitle(game)} game
                    </button>
                  </div>
                </div>
                <div className="preview-wrap">
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
                    <span className="preview-drop red" aria-hidden="true" />
                    <span className="preview-drop yellow" aria-hidden="true" />
                  </div>
                </div>
              </div>
            </Reveal>
          </section>

          <footer className="footer">
            <span className="footer-brand">ClockT</span>
            <p>Real-time multiplayer games — built with React, Socket.io &amp; Node.</p>
            <p className="footer-meta">No sign-up · Free · Open to the world</p>
          </footer>
        </section>
      )}

      {screen === 'joining' && (
        <section className="screen" key="joining">
          <div className="card">
            <p className="card-title">Join {gameTitle(game)} game</p>
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
              <button className="btn btn-primary link-copy" onClick={copyLink}>
                {copied ? 'Copied!' : 'Copy'}
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