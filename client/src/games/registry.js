export const GAMES = [
  {
    id: 'connect4',
    title: 'Connect 4',
    tagline: 'Drop discs, line up four',
    icon: 'c4',
  },
  {
    id: 'tictactoe',
    title: 'Tic-Tac-Toe',
    tagline: 'Get three in a row',
    icon: 'ttt',
  },
  {
    id: 'rps',
    title: 'Rock Paper Scissors',
    tagline: 'First to 3 wins',
    icon: 'rps',
  },
];

export const gameById = Object.fromEntries(GAMES.map(g => [g.id, g]));

export function gameTitle(id) {
  return (gameById[id] || gameById.connect4).title;
}
