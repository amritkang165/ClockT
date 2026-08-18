import { socket } from '../socket';

const MOVES = [
  { id: 'rock', label: 'Rock', glyph: '✊' },
  { id: 'paper', label: 'Paper', glyph: '✋' },
  { id: 'scissors', label: 'Scissors', glyph: '✌️' },
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
  let resultText = '';
  if (winnerKey) {
    status = winnerKey === myKey ? 'You win the match!' : 'You lose the match.';
  } else if (resolved) {
    const rw = roundResult.winner;
    status = rw === null ? 'Round draw.' : rw === myIndex ? 'You win the round!' : 'You lose the round.';
  } else if (yourChoice) {
    status = 'Waiting for opponent...';
  } else {
    status = 'Pick your move';
  }

  const moveLabel = (id) => (MOVES.find(m => m.id === id) || {}).label || id;

  return (
    <div className="game-panel rps-panel">
      <div className="rps-scores">
        <div className={`rps-score ${!resolved && !winnerKey ? 'idle' : ''}`}>
          <span className="chip red" />
          <span className="rps-name">{you}</span>
          <span className="rps-score-num">{scores[myIndex]}</span>
        </div>
        <span className="rps-round">
          Round {round} · first to 3
        </span>
        <div className={`rps-score ${!resolved && !winnerKey ? 'idle' : ''}`}>
          <span className="rps-score-num">{scores[oppIndex]}</span>
          <span className="rps-name">{opp}</span>
          <span className="chip yellow" />
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
            <span className="rps-glyph">{m.glyph}</span>
            <span className="rps-label">{m.label}</span>
          </button>
        ))}
      </div>

      {resolved && (
        <div className="rps-result">
          <div className="rps-moves">
            <div className={`rps-move ${roundResult.winner === myIndex ? 'win' : ''}`}>
              <span className="chip red" />
              <span>{you}</span>
              <b>{moveLabel(roundResult.moves[myIndex])}</b>
            </div>
            <div className={`rps-move ${roundResult.winner === oppIndex ? 'win' : ''}`}>
              <span className="chip yellow" />
              <span>{opp}</span>
              <b>{moveLabel(roundResult.moves[oppIndex])}</b>
            </div>
          </div>
          <p className={`rps-status ${roundResult.winner === myIndex ? 'good' : ''} ${
            roundResult.winner === null ? 'draw' : ''
          }`}>{(resultText || status)}</p>
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