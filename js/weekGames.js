export const games = [
  // Thu
  { homeTeam: 'Lions',        awayTeam: 'Cowboys',      homeRecord: '7-5',   awayRecord: '6-5-1' },

  // Sun early
  { homeTeam: 'Falcons',      awayTeam: 'Seahawks',     homeRecord: '4-8',   awayRecord: '9-3' },
  { homeTeam: 'Bills',        awayTeam: 'Bengals',      homeRecord: '8-4',   awayRecord: '4-8' },
  { homeTeam: 'Browns',       awayTeam: 'Titans',       homeRecord: '3-9',   awayRecord: '1-11' },
  { homeTeam: 'Vikings',      awayTeam: 'Commanders',   homeRecord: '4-8',   awayRecord: '3-9' },
  { homeTeam: 'Jets',         awayTeam: 'Dolphins',     homeRecord: '3-9',   awayRecord: '5-7' },
  { homeTeam: 'Buccaneers',   awayTeam: 'Saints',       homeRecord: '7-5',   awayRecord: '2-10' },
  { homeTeam: 'Jaguars',      awayTeam: 'Colts',        homeRecord: '8-4',   awayRecord: '8-4' },
  { homeTeam: 'Ravens',       awayTeam: 'Steelers',     homeRecord: '6-6',   awayRecord: '6-6' },

  // Sun late
  { homeTeam: 'Raiders',      awayTeam: 'Broncos',      homeRecord: '2-10',  awayRecord: '10-2' }, // 4:05 ET
  { homeTeam: 'Packers',      awayTeam: 'Bears',        homeRecord: '8-3-1', awayRecord: '9-3' },  // 4:25 ET
  { homeTeam: 'Cardinals',    awayTeam: 'Rams',         homeRecord: '3-9',   awayRecord: '9-3' },  // 4:25 ET

  // Sun night
  { homeTeam: 'Chiefs',       awayTeam: 'Texans',       homeRecord: '6-6',   awayRecord: '7-5' },

  // Mon night
  { homeTeam: 'Chargers',     awayTeam: 'Eagles',       homeRecord: '8-4',   awayRecord: '8-4' },
];

export const gameLabel = (g) => `${g.awayTeam} @ ${g.homeTeam}`;
export const norm = (s) => String(s ?? '').trim().toLowerCase();
