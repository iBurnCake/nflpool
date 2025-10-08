export const games = [
  { homeTeam: 'Eagles',       awayTeam: 'Giants',        homeRecord: '4-1',   awayRecord: '1-4' },
  { homeTeam: 'Broncos',      awayTeam: 'Jets',          homeRecord: '3-2',   awayRecord: '0-5' },
  { homeTeam: 'Seahawks',     awayTeam: 'Jaguars',       homeRecord: '3-2',   awayRecord: '4-1' },
  { homeTeam: 'Chargers',     awayTeam: 'Dolphins',      homeRecord: '3-2',   awayRecord: '1-4' },
  { homeTeam: 'Steelers',     awayTeam: 'Browns',        homeRecord: '3-1',   awayRecord: '1-4' },
  { homeTeam: 'Colts',        awayTeam: 'Cardinals',     homeRecord: '4-1',   awayRecord: '2-3' },
  { homeTeam: 'Panthers',     awayTeam: 'Cowboys',       homeRecord: '2-3',   awayRecord: '2-2-1' },
  { homeTeam: 'Ravens',       awayTeam: 'Rams',          homeRecord: '1-4',   awayRecord: '3-2' },
  { homeTeam: 'Raiders',      awayTeam: 'Titans',        homeRecord: '1-4',   awayRecord: '1-4' },
  { homeTeam: 'Packers',      awayTeam: 'Bengals',       homeRecord: '2-1-1', awayRecord: '2-3' },
  { homeTeam: 'Buccaneers',   awayTeam: '49ers',         homeRecord: '4-1',   awayRecord: '4-1' },
  { homeTeam: 'Chiefs',       awayTeam: 'Lions',         homeRecord: '2-3',   awayRecord: '4-1' },
  { homeTeam: 'Saints',       awayTeam: 'Patriots',      homeRecord: '1-4',   awayRecord: '3-2' },
  { homeTeam: 'Falcons',      awayTeam: 'Bills',         homeRecord: '2-2',   awayRecord: '4-1' },
  { homeTeam: 'Bears',        awayTeam: 'Commanders',    homeRecord: '2-2',   awayRecord: '3-2' },
];

export const gameLabel = (g) => `${g.awayTeam} @ ${g.homeTeam}`;
export const norm = (s) => String(s ?? '').trim().toLowerCase();
