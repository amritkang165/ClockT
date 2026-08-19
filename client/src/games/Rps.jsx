import { socket } from '../socket';
import { BearFace, HawkFace, SnakeFace } from '../art.jsx';

const MOVES = [
  { id: 'bear', label: 'Bear', hint: 'Beats hawk', Face: BearFace },
  { id: 'hawk', label: 'Hawk', hint: 'Beats snake', Face: HawkFace },
  { id: 'snake', label: 'Snake', hint: 'Beats bear', Face: SnakeFace },
];

export default function Rps({ state, myIndex, myKey, myName, names, winnerKey }) {
  const { round, scores, yourChoice, opponentChoice, resolved, roundResult } = state;

  const oppIndex = 1 - myIndex;
  const canPick = !yourChoice && !resolved && !winnerKey;

  const pick = (move) => {
    if (canPick) socket.emit('makeMove', move);
  };

  const nextRound = () => socket.emit('nextRound');
  const playAgain = () => socket.emit('playAgain');

  const you = myName || 'You';
  const opp = names[oppIndex] || 'Opponent';

  let status = '';
  if (winnerKey) {
    status = winnerKey === myKey ? 'Your animal wins the match!' : 'Your animal lost the match.';
  } else if (resolved) {
    const rw = roundResult.winner;
    status = rw === null ? 'Round draw.' : rw === myIndex ? 'Your animal wins the round!' : 'Round lost.';
  } else if (yourChoice) {
    status = 'Waiting for opponent...';
  } else {
    status = 'Pick your move';
  }

  const meta = (id) => MOVES.find(m => m.id === id) || { label: id };

  return (
    <div className="game-panel rps-panel">
      <div className="rps-scores">
        <div className={`rps-score ${myKey}`}>
          <span className="chip fox" />
          <span className="rps-name">{you}</span>
          <span className="rps-score-num">{scores[myIndex]}</span>
        </div>
        <span className="rps-round">
          Round {round} · first to 3
        </span>
        <div className={`rps-score ${myKey === 'red' ? 'yellow' : 'red'}`}>
          <span className="rps-score-num">{scores[oppIndex]}</span>
          <span className="rps-name">{opp}</span>
          <span className="chip panda" />
        </div>
      </div>

      <div className="rps-actions">
        {MOVES.map(m => (
          <button
            key={m.id}
            className={`rps-btn ${
              yourChoice === m.id ? 'picked' : canPick ? 'live' : ''
            }`}
            onClick={() => pick(m.id)}
          >
            <span className="rps-glyph"><m.Face /></span>
            <span className="rps-label">{m.label}</span>
            <span className="rps-hint">{m.hint}</span>
          </button>
        ))}
      </div>

      {resolved && (
        <div className="rps-result">
          <div className="rps-moves">
            <div className={`rps-move ${roundResult.winner === myIndex ? 'win' : ''}`}>
              <span className="chip fox" />
              <span>{you}</span>
              <b>{meta(roundResult.moves[myIndex]).label}</b>
            </div>
            <div className={`rps-move ${roundResult.winner === oppIndex ? 'win' : ''}`}>
              <span className="chip panda" />
              <span>{opp}</span>
              <b>{meta(roundResult.moves[oppIndex]).label}</b>
            </div>
          </div>
          <p className={`rps-status ${roundResult.winner === myIndex ? 'good' : ''} ${
            roundResult.winner === null ? 'draw' : ''
          }`}>{status}</p>
          {winnerKey ? (
            <button className="btn btn-primary" onClick={playAgain}>
              Play again
            </button>
          ) : (
            <button className="btn btn-primary" onClick={nextRound}>
              Next round
            </button>
          )}
        </div>
      )}

      {!resolved && <p className="rps-status">{status}</p>}
    </div>
  );
}