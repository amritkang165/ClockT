import { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { socket } from './socket';
import { GAMES, gameTitle } from './games/registry';
import Connect4 from './games/Connect4';
import TicTacToe from './games/TicTacToe';
import Rps from './games/Rps';
import { FoxFace, PandaFace, BearFace, HawkFace, SnakeFace, Fox, Panda } from './art.jsx';
import './styles.css';

const TEAMS = {
  red: { name: 'Fox', face: FoxFace, team: 'fox' },
  yellow: { name: 'Panda', face: PandaFace, team: 'panda' },
};

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

const HOW_STEPS = [
  { n: '01', title: 'Pick a game', text: 'Connect 4, Tic-Tac-Toe, or Animal Clash.' },
  { n: '02', title: 'Share your room link', text: 'Your friend joins and picks an animal, too.' },
  { n: '03', title: 'Play live', text: 'Moves sync over WebSockets. Your animal celebrates.' },
];

const PUBLIC_ORIGIN =
  (import.meta.env.VITE_PUBLIC_URL || '').replace(/\/$/, '') ||
  window.location.origin;

function Reveal({ as: Tag = 'div', delay = 0, dir = '', className = '', children }) {
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
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Tag
      ref={ref}
      className={`reveal ${dir ? `dir-${dir}` : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}

function Cursor() {
  useEffect(() => {
    const fine = window.matchMedia('(any-pointer: fine)').matches;
    if (!fine) return;
    const dot = document.querySelector('.cursor-dot');
    const ring = document.querySelector('.cursor-ring');
    if (!dot || !ring) return;
    document.body.classList.add('cursor-active');
    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let rx = mx;
    let ry = my;
    let raf;
    const onMove = (e) => {
      mx = e.clientX;
      my = e.clientY;
    };
    const onOver = (e) => {
      const big = e.target.closest('button, a, input, .cell, .ttt-cell, .rps-btn, .game-card');
      dot.classList.toggle('big', Boolean(big));
      ring.classList.toggle('big', Boolean(big));
    };
    const onDown = () => dot.classList.add('click');
    const onUp = () => dot.classList.remove('click');
    const loop = () => {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mouseover', onOver, { passive: true });
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseover', onOver);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      document.body.classList.remove('cursor-active');
    };
  }, []);
  return (
    <>
      <div className="cursor-dot" />
      <div className="cursor-ring" />
    </>
  );
}

function MiniIcon({ icon }) {
  if (icon === 'c4') {
    return (
      <span className="mini-pair" aria-hidden="true">
        <FoxFace />
        <PandaFace />
      </span>
    );
  }
  if (icon === 'ttt') {
    return (
      <span className="mini-pair" aria-hidden="true">
        <PandaFace />
        <FoxFace />
      </span>
    );
  }
  return (
    <span className="mini-pair" aria-hidden="true">
      <BearFace />
      <SnakeFace />
    </span>
  );
}

function GameDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const current = GAMES.find((g) => g.id === value) || GAMES[0];

  return (
    <div className={`dd ${open ? 'open' : ''}`} ref={ref}>
      <button
        type="button"
        className="dd-toggle"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="dd-current">
          <MiniIcon icon={current.icon} />
          {current.title}
        </span>
        <svg
          className="dd-chevron"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      <div className="dd-menu" role="listbox">
        {GAMES.map((g) => (
          <button
            key={g.id}
            type="button"
            role="option"
            aria-selected={g.id === value}
            className={`dd-item ${g.id === value ? 'selected' : ''}`}
            onClick={() => {
              onChange(g.id);
              setOpen(false);
            }}
          >
            <MiniIcon icon={g.icon} />
            <span className="dd-item-text">
              <b>{g.title}</b>
              <small>{g.tagline}</small>
            </span>
            {g.id === value && (
              <svg
                className="dd-check"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

const BUBBLES = [
  { left: '8%', top: '12%', size: 26, delay: 0, color: 'rgba(251,146,60,0.35)' },
  { left: '88%', top: '18%', size: 18, delay: 1.1, color: 'rgba(14,165,233,0.32)' },
  { left: '92%', top: '62%', size: 30, delay: 0.5, color: 'rgba(251,146,60,0.28)' },
  { left: '5%', top: '70%', size: 16, delay: 1.7, color: 'rgba(14,165,233,0.3)' },
];

function GameArt({ icon }) {
  if (icon === 'c4') {
    return (
      <div className="g-art c4" aria-hidden="true">
        <span className="g-disc fox"><FoxFace /></span>
        <span className="g-disc panda"><PandaFace /></span>
      </div>
    );
  }
  if (icon === 'ttt') {
    return (
      <div className="g-art ttt" aria-hidden="true">
        <span><FoxFace /></span>
        <span className="empty" />
        <span><PandaFace /></span>
        <span className="empty" />
        <span className="mid"><FoxFace /></span>
        <span className="empty" />
        <span><PandaFace /></span>
        <span className="empty" />
        <span><FoxFace /></span>
      </div>
    );
  }
  return (
    <div className="g-art rps" aria-hidden="true">
      <span className="rps-bear"><BearFace /></span>
      <span className="rps-hawk"><HawkFace /></span>
      <span className="rps-snake"><SnakeFace /></span>
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
  const [scrollY, setScrollY] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      setScrollY(window.scrollY);
      setProgress(max > 0 ? window.scrollY / max : 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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
  const myTeam = TEAMS[myKey];
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
    const oppAnimal = TEAMS[myIndex === 0 ? 'yellow' : 'red'].name;
    if (!opponentConnected) {
      status = 'Waiting for opponent...';
    } else if (winnerKey === 'draw') {
      status = "It's a draw!";
    } else if (winnerKey) {
      status = `${TEAMS[winnerKey].name} wins!`;
    } else if (myTurn) {
      status =
        game === 'connect4' ? 'Drop your animal!' :
        game === 'tictactoe' ? 'Place your animal' :
        'Pick your move';
    } else {
      status = `${oppAnimal} is thinking…`;
    }
  }

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const WinnerFace = TEAMS[winnerKey] ? TEAMS[winnerKey].face : null;
  const foxDrift = -scrollY * 0.06;
  const pandaDrift = scrollY * 0.045;

  return (
    <main className="app">
      <Cursor />
      <div
        className="scroll-progress"
        style={{ width: `${progress * 100}%` }}
        aria-hidden="true"
      />
      {screen === 'landing' && (
        <section className="screen home" key="landing">
          <nav className="navbar">
            <a className="brand" href="#top" onClick={(e) => { e.preventDefault(); scrollTo('top'); }}>
              <span className="logo-mini" aria-hidden="true">
                <FoxFace className="logo-fox" />
                <PandaFace className="logo-panda" />
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
            <div className="hero-inner">
              <Reveal>
                <p className="kicker">Cute animals. Real games.</p>
              </Reveal>
              <Reveal delay={80}>
                <h1 className="title">
                  <span className="title-fox">Fox</span> vs.{' '}
                  <span className="title-panda">Panda</span>
                </h1>
              </Reveal>
              <Reveal delay={140}>
                <p className="subtitle">
                  Pick your animal and square off in Connect 4, Tic-Tac-Toe, or
                  Animal Clash. Create a room, share the link, play live.
                </p>
              </Reveal>
              <Reveal delay={200}>
                <div className="hero-cta">
                  <button className="btn btn-primary" onClick={() => scrollTo('play')}>
                    Create a game
                  </button>
                  <a className="text-link" href="#games" onClick={(e) => { e.preventDefault(); scrollTo('games'); }}>
                    See the games
                  </a>
                </div>
              </Reveal>
            </div>
            <Reveal delay={180} className="hero-mascots-wrap">
              <div className="hero-mascots" aria-hidden="true">
                {BUBBLES.map((b, i) => (
                  <span
                    key={i}
                    className="bubble"
                    style={{
                      left: b.left,
                      top: b.top,
                      width: b.size,
                      height: b.size,
                      background: b.color,
                      animationDelay: `${b.delay}s`,
                    }}
                  />
                ))}
                <span className="blob blob-a" />
                <span className="blob blob-b" />
                <div
                  className="mascot-wrap fox"
                  style={{ transform: `translateY(${foxDrift}px) rotate(-6deg)` }}
                >
                  <Fox className="mascot mascot-fox" />
                </div>
                <div
                  className="mascot-wrap panda"
                  style={{ transform: `translateY(${pandaDrift}px) rotate(4deg)` }}
                >
                  <Panda className="mascot mascot-panda" />
                </div>
              </div>
            </Reveal>
          </header>

          <section className="section games-section" id="games">
            <Reveal>
              <p className="kicker">The games</p>
            </Reveal>
            <Reveal delay={60}>
              <h2 className="section-title">Choose your game</h2>
            </Reveal>
            <div className="game-grid">
              {GAMES.map((g, i) => (
                <Reveal key={g.id} delay={i * 90}>
                  <button
                    className={`game-card ${game === g.id ? 'selected' : ''}`}
                    onClick={() => setGame(g.id)}
                  >
                    <span className="game-card-top">
                      <span className="game-card-num">0{i + 1}</span>
                      {game === g.id && <span className="game-card-selected">Selected</span>}
                    </span>
                    <GameArt icon={g.icon} />
                    <span className="game-card-title">{g.title}</span>
                    <span className="game-card-tagline">{g.tagline}</span>
                  </button>
                </Reveal>
              ))}
            </div>
          </section>

          <section className="section how-section" id="how">
            <Reveal>
              <p className="kicker">How it works</p>
            </Reveal>
            <Reveal delay={60}>
              <h2 className="section-title">Live in three steps</h2>
            </Reveal>
            <div className="how-grid">
              {HOW_STEPS.map((s, i) => (
                <Reveal
                  key={s.n}
                  delay={i * 90}
                  dir={i === 0 ? 'dir-left' : i === 2 ? 'dir-right' : ''}
                >
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
            <Reveal delay={60}>
              <h2 className="section-title">Start a room — it&apos;s free</h2>
            </Reveal>
            <Reveal delay={140}>
              <div className="play-box">
                <div className="play-form">
                  <GameDropdown value={game} onChange={setGame} />
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
                          const Face = piece
                            ? TEAMS[piece[2]].face
                            : null;
                          return (
                            <div
                              key={`${r + 2}-${c}`}
                              className={`preview-cell ${piece ? piece[2] : ''}`}
                            >
                              {piece && <Face />}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </section>

          <footer className="footer">
            <span className="footer-brand">ClockT</span>
            <p>Fox vs. Panda. Real-time multiplayer games. Built with React, Socket.io &amp; Node.</p>
            <p className="footer-meta">No sign-up · Free</p>
          </footer>
        </section>
      )}

      {screen === 'joining' && (
        <section className="screen" key="joining">
          <div className="card">
            <div className="card-mascots" aria-hidden="true">
              <FoxFace className="lm-fox" />
              <PandaFace className="lm-panda" />
            </div>
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
            <div className="card-mascots" aria-hidden="true">
              <FoxFace className="lm-fox" />
              <PandaFace className="lm-panda" />
            </div>
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
              <span>Waiting for your opponent to join...</span>
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
                  <FoxFace className="pchip fox" />
                  <span>{myIndex === 0 ? `${myName || 'You'}` : displayName(0)}</span>
                </div>
                <span className="vs">vs</span>
                <div className={`player ${state.turn === 1 && !winnerKey ? 'active' : ''}`}>
                  <PandaFace className="pchip panda" />
                  <span>{myIndex === 1 ? `${myName || 'You'}` : displayName(1)}</span>
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
                <TicTacToe state={state} myTurn={myTurn} winnerKey={winnerKey} />
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
                      {winnerKey === 'draw' ? (
                        <>
                          <FoxFace className="rm-fox" />
                          <PandaFace className="rm-panda" />
                        </>
                      ) : (
                        WinnerFace && <WinnerFace className="rm-mascot" />
                      )}
                    </div>
                    <h2>
                      {winnerKey === 'draw'
                        ? "It's a draw!"
                        : `${TEAMS[winnerKey].name} takes the win!`}
                    </h2>
                    <p>
                      {winnerKey === 'draw'
                        ? 'No more moves available.'
                        : 'Your animal did great tonight.'}
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