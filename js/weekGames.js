export const games = [
  // Thu
  { homeTeam: 'Broncos',     awayTeam: 'Raiders',      homeRecord: '7-2',   awayRecord: '2-6' },

  // Sun 9:30 AM (Berlin)
  { homeTeam: 'Falcons',     awayTeam: 'Colts',        homeRecord: '3-5',   awayRecord: '7-2' },

  // Sun 1:00 PM ET
  { homeTeam: 'Panthers',    awayTeam: 'Saints',       homeRecord: '5-4',   awayRecord: '1-8' },
  { homeTeam: 'Bears',       awayTeam: 'Giants',       homeRecord: '5-3',   awayRecord: '2-7' },
  { homeTeam: 'Texans',      awayTeam: 'Jaguars',      homeRecord: '3-5',   awayRecord: '5-3' },
  { homeTeam: 'Dolphins',    awayTeam: 'Bills',        homeRecord: '2-7',   awayRecord: '6-2' },
  { homeTeam: 'Vikings',     awayTeam: 'Ravens',       homeRecord: '4-4',   awayRecord: '3-5' },
  { homeTeam: 'Jets',        awayTeam: 'Browns',       homeRecord: '1-7',   awayRecord: '2-6' },
  { homeTeam: 'Buccaneers',  awayTeam: 'Patriots',     homeRecord: '6-2',   awayRecord: '7-2' },

  // Sun late
  { homeTeam: 'Seahawks',    awayTeam: 'Cardinals',    homeRecord: '6-2',   awayRecord: '3-5' },
  { homeTeam: 'Commanders',  awayTeam: 'Lions',        homeRecord: '3-6',   awayRecord: '5-3' },
  { homeTeam: '49ers',       awayTeam: 'Rams',         homeRecord: '6-3',   awayRecord: '6-2' },

  // Sun night
  { homeTeam: 'Chargers',    awayTeam: 'Steelers',     homeRecord: '6-3',   awayRecord: '5-3' },

  // Mon night
  { homeTeam: 'Packers',     awayTeam: 'Eagles',       homeRecord: '5-2-1', awayRecord: '6-2' },
];


export const gameLabel = (g) => `${g.awayTeam} @ ${g.homeTeam}`;
export const norm = (s) => String(s ?? '').trim().toLowerCase();
