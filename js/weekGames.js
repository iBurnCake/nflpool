export const games = [
// Thu
// Thu
  { homeTeam: 'Texans',       awayTeam: 'Bills',        homeRecord: '5-5',   awayRecord: '7-3' },

  // Sun early
  { homeTeam: 'Bears',        awayTeam: 'Steelers',     homeRecord: '7-3',   awayRecord: '6-4' },
  { homeTeam: 'Bengals',      awayTeam: 'Patriots',     homeRecord: '3-7',   awayRecord: '9-2' },
  { homeTeam: 'Ravens',       awayTeam: 'Jets',         homeRecord: '5-5',   awayRecord: '2-8' },
  { homeTeam: 'Lions',        awayTeam: 'Giants',       homeRecord: '6-4',   awayRecord: '2-9' },
  { homeTeam: 'Titans',       awayTeam: 'Seahawks',     homeRecord: '1-9',   awayRecord: '7-3' },
  { homeTeam: 'Chiefs',       awayTeam: 'Colts',        homeRecord: '2-8',   awayRecord: '8-2' },
  { homeTeam: 'Packers',      awayTeam: 'Vikings',      homeRecord: '6-3-1', awayRecord: '4-6' },

  // Sun late
  { homeTeam: 'Raiders',      awayTeam: 'Browns',       homeRecord: '5-5',   awayRecord: '2-8' }, // 4:05 ET
  { homeTeam: 'Cardinals',    awayTeam: 'Jaguars',      homeRecord: '3-7',   awayRecord: '6-4' }, // 4:05 ET
  { homeTeam: 'Cowboys',      awayTeam: 'Eagles',       homeRecord: '4-5-1', awayRecord: '8-2' }, // 4:25 ET
  { homeTeam: 'Saints',       awayTeam: 'Falcons',      homeRecord: '2-8',   awayRecord: '3-7' }, // 4:25 ET

  // Sun night
  { homeTeam: 'Rams',         awayTeam: 'Buccaneers',   homeRecord: '8-2',   awayRecord: '6-4' },

  // Mon night
  { homeTeam: '49ers',        awayTeam: 'Panthers',     homeRecord: '7-4',   awayRecord: '6-5' },
];


export const gameLabel = (g) => `${g.awayTeam} @ ${g.homeTeam}`;
export const norm = (s) => String(s ?? '').trim().toLowerCase();
