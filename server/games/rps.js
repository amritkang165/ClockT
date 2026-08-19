const MOVES = ['bear', 'hawk', 'snake'];
const WIN_AGAINST = { bear: 'hawk', hawk: 'snake', snake: 'bear' };
const WINS_TO_WIN = 3;

function create() {
  return {
    round: 1,
    scores: [0, 0],
    choices: [null, null],
    resolved: false,
    roundResult: null,
  };
}

function resolve(room, index) {
  const st = room.state;
  const a = st.choices[0];
  const b = st.choices[1];
  let roundWinner = null;
  if (a !== b) {
    roundWinner = WIN_AGAINST[a] === b ? 0 : 1;
    st.scores[roundWinner] += 1;
  }
  st.roundResult = { moves: [a, b], winner: roundWinner };
  st.resolved = true;
  if (roundWinner !== null && st.scores[roundWinner] >= WINS_TO_WIN) {
    room.winner = roundWinner === 0 ? 'red' : 'yellow';
  }
}

function applyMove(room, index, action) {
  const st = room.state;
  if (room.winner) return { ok: false, message: 'This game is already over.' };
  if (!MOVES.includes(action)) return { ok: false, message: 'Invalid move.' };
  if (st.resolved) {
    return { ok: false, message: 'This round already finished.' };
  }
  if (st.choices[index]) {
    return { ok: false, message: 'You already picked this round.' };
  }
  st.choices[index] = action;
  if (st.choices[0] && st.choices[1]) resolve(room, index);
  return { ok: true };
}

function nextRound(room) {
  const st = room.state;
  st.choices = [null, null];
  st.resolved = false;
  st.roundResult = null;
  if (!room.winner) st.round += 1;
}

function snapshot(room, index) {
  const st = room.state;
  const opponent = 1 - index;
  const bothPicked = Boolean(st.choices[0] && st.choices[1]);
  return {
    round: st.round,
    scores: st.scores,
    yourChoice: st.choices[index],
    opponentChoice: bothPicked ? st.choices[opponent] : null,
    resolved: st.resolved,
    roundResult: st.resolved ? st.roundResult : null,
  };
}

module.exports = {
  id: 'rps',
  title: 'Animal Clash',
  tagline: 'Bear, hawk, snake — first to 3 wins',
  MOVES,
  WINS_TO_WIN,
  create,
  applyMove,
  nextRound,
  snapshot,
};
