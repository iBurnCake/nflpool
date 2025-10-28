export const games = [
  { homeTeam: 'Dolphins',   awayTeam: 'Ravens',    homeRecord: '2-6', awayRecord: '2-5' },

  // Sun early
  { homeTeam: 'Texans',     awayTeam: 'Broncos',   homeRecord: '3-4', awayRecord: '6-2' },
  { homeTeam: 'Giants',     awayTeam: '49ers',     homeRecord: '2-6', awayRecord: '5-3' },
  { homeTeam: 'Steelers',   awayTeam: 'Colts',     homeRecord: '4-3', awayRecord: '7-1' },
  { homeTeam: 'Packers',    awayTeam: 'Panthers',  homeRecord: '5-1', awayRecord: '4-4' },
  { homeTeam: 'Lions',      awayTeam: 'Vikings',   homeRecord: '5-2', awayRecord: '3-4' },
  { homeTeam: 'Titans',     awayTeam: 'Chargers',  homeRecord: '1-7', awayRecord: '5-3' },
  { homeTeam: 'Patriots',   awayTeam: 'Falcons',   homeRecord: '6-2', awayRecord: '3-4' },
  { homeTeam: 'Bengals',    awayTeam: 'Bears',     homeRecord: '3-5', awayRecord: '4-3' },

  // Sun late
  { homeTeam: 'Raiders',    awayTeam: 'Jaguars',   homeRecord: '2-5', awayRecord: '4-3' },
  { homeTeam: 'Rams',       awayTeam: 'Saints',    homeRecord: '5-2', awayRecord: '1-7' },
  { homeTeam: 'Bills',      awayTeam: 'Chiefs',    homeRecord: '5-2', awayRecord: '5-3' },

  // Sun night
  { homeTeam: 'Commanders', awayTeam: 'Seahawks',  homeRecord: '3-5', awayRecord: '5-2' },

  // Mon night
  { homeTeam: 'Cowboys',    awayTeam: 'Cardinals', homeRecord: '3-4', awayRecord: '2-5' },
];


export const gameLabel = (g) => `${g.awayTeam} @ ${g.homeTeam}`;
export const norm = (s) => String(s ?? '').trim().toLowerCase();
