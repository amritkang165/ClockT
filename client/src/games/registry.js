export const GAMES = [
  {
    id: 'connect4',
    title: 'Connect 4',
    tagline: 'Drop your animal, line up four',
    icon: 'c4',
  },
  {
    id: 'tictactoe',
    title: 'Tic-Tac-Toe',
    tagline: 'Three in a row wins',
    icon: 'ttt',
  },
  {
    id: 'rps',
    title: 'Animal Clash',
    tagline: 'Bear, hawk, snake — first to 3',
    icon: 'rps',
  },
];

export const gameById = Object.fromEntries(GAMES.map(g => [g.id, g]));

export function gameTitle(id) {
  return (gameById[id] || gameById.connect4).title;
}
