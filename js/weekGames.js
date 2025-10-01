export const games = [
  { homeTeam: '49ers',     awayTeam: 'Rams',       homeRecord: '3-1', awayRecord: '3-1' },
  { homeTeam: 'Vikings',   awayTeam: 'Browns',     homeRecord: '2-2', awayRecord: '1-3' },
  { homeTeam: 'Cowboys',   awayTeam: 'Jets',       homeRecord: '1-2-1', awayRecord: '0-4' }, // tie ignored
  { homeTeam: 'Giants',    awayTeam: 'Saints',     homeRecord: '1-3', awayRecord: '0-4' },
  { homeTeam: 'Raiders',   awayTeam: 'Colts',      homeRecord: '1-3', awayRecord: '3-1' },
  { homeTeam: 'Dolphins',  awayTeam: 'Panthers',   homeRecord: '1-3', awayRecord: '1-3' },
  { homeTeam: 'Broncos',   awayTeam: 'Eagles',     homeRecord: '2-2', awayRecord: '4-0' },
  { homeTeam: 'Texans',    awayTeam: 'Ravens',     homeRecord: '1-3', awayRecord: '1-3' },
  { homeTeam: 'Titans',    awayTeam: 'Cardinals',  homeRecord: '0-4', awayRecord: '2-2' },
  { homeTeam: 'Buccaneers',awayTeam: 'Seahawks',   homeRecord: '3-1', awayRecord: '3-1' },
  { homeTeam: 'Lions',     awayTeam: 'Bengals',    homeRecord: '3-1', awayRecord: '2-2' },
  { homeTeam: 'Commanders',awayTeam: 'Chargers',   homeRecord: '2-2', awayRecord: '3-1' },
  { homeTeam: 'Patriots',  awayTeam: 'Bills',      homeRecord: '2-2', awayRecord: '4-0' },
  { homeTeam: 'Chiefs',    awayTeam: 'Jaguars',    homeRecord: '2-2', awayRecord: '3-1' },
];

export const gameLabel = (g) => `${g.awayTeam} @ ${g.homeTeam}`;
export const norm = (s) => String(s ?? '').trim().toLowerCase();
