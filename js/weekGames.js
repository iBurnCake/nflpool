// js/weekGames.js
// Update this array each week and everything else stays in sync.
export const games = [
  // Thu
  { homeTeam: 'Cardinals',  awayTeam: 'Seahawks',  homeRecord: '2-1', awayRecord: '2-1' },

  // Sun 9:30 AM ET (Dublin)
  { homeTeam: 'Steelers',   awayTeam: 'Vikings',   homeRecord: '2-1', awayRecord: '2-1' },

  // Sun 1:00 ET
  { homeTeam: 'Falcons',    awayTeam: 'Commanders', homeRecord: '1-2', awayRecord: '2-1' },
  { homeTeam: 'Giants',     awayTeam: 'Chargers',   homeRecord: '0-3', awayRecord: '3-0' },
  { homeTeam: 'Texans',     awayTeam: 'Titans',     homeRecord: '0-3', awayRecord: '0-3' },
  { homeTeam: 'Buccaneers', awayTeam: 'Eagles',     homeRecord: '3-0', awayRecord: '3-0' },
  { homeTeam: 'Patriots',   awayTeam: 'Panthers',   homeRecord: '1-2', awayRecord: '1-2' },
  { homeTeam: 'Bills',      awayTeam: 'Saints',     homeRecord: '3-0', awayRecord: '0-3' },
  { homeTeam: 'Lions',      awayTeam: 'Browns',     homeRecord: '2-1', awayRecord: '1-2' },

  // Sun late
  { homeTeam: '49ers',      awayTeam: 'Jaguars',    homeRecord: '3-0', awayRecord: '2-1' }, // 4:05
  { homeTeam: 'Rams',       awayTeam: 'Colts',      homeRecord: '2-1', awayRecord: '3-0' }, // 4:05
  { homeTeam: 'Raiders',    awayTeam: 'Bears',      homeRecord: '1-2', awayRecord: '1-2' }, // 4:25
  { homeTeam: 'Chiefs',     awayTeam: 'Ravens',     homeRecord: '1-2', awayRecord: '1-2' }, // 4:25

  // SNF
  { homeTeam: 'Cowboys',    awayTeam: 'Packers',    homeRecord: '1-2', awayRecord: '2-1' }, // 8:20

  // MNF (doubleheader)
  { homeTeam: 'Dolphins',   awayTeam: 'Jets',       homeRecord: '0-3', awayRecord: '0-3' }, // 7:15
  { homeTeam: 'Broncos',    awayTeam: 'Bengals',    homeRecord: '1-2', awayRecord: '2-1' }, // 8:15
];

// Helpers (optional)
export const gameLabel = (g) => `${g.awayTeam} @ ${g.homeTeam}`;
export const norm = (s) => String(s ?? '').trim().toLowerCase();
