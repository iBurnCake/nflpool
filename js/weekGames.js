export const games = [
  // Thu
  { homeTeam: 'Buccaneers',   awayTeam: 'Falcons',     homeRecord: '7-6',  awayRecord: '4-9' },

  // Sun early
  { homeTeam: 'Giants',       awayTeam: 'Commanders',  homeRecord: '2-11', awayRecord: '3-10' },
  { homeTeam: 'Eagles',       awayTeam: 'Raiders',     homeRecord: '8-5',  awayRecord: '2-11' },
  { homeTeam: 'Bears',        awayTeam: 'Browns',      homeRecord: '9-4',  awayRecord: '3-10' },
  { homeTeam: 'Bengals',      awayTeam: 'Ravens',      homeRecord: '4-9',  awayRecord: '6-7' },
  { homeTeam: 'Texans',       awayTeam: 'Cardinals',   homeRecord: '8-5',  awayRecord: '3-10' },
  { homeTeam: 'Patriots',     awayTeam: 'Bills',       homeRecord: '11-2', awayRecord: '9-4' },
  { homeTeam: 'Jaguars',      awayTeam: 'Jets',        homeRecord: '9-4',  awayRecord: '3-10' },
  { homeTeam: 'Chiefs',       awayTeam: 'Chargers',    homeRecord: '6-7',  awayRecord: '9-4' },

  // Sun late
  { homeTeam: 'Seahawks',     awayTeam: 'Colts',       homeRecord: '10-3', awayRecord: '8-5' },
  { homeTeam: '49ers',        awayTeam: 'Titans',      homeRecord: '9-4',  awayRecord: '2-11' },
  { homeTeam: 'Broncos',      awayTeam: 'Packers',     homeRecord: '11-2', awayRecord: '9-3' },
  { homeTeam: 'Saints',       awayTeam: 'Panthers',    homeRecord: '3-10', awayRecord: '7-6' },
  { homeTeam: 'Rams',         awayTeam: 'Lions',       homeRecord: '10-3', awayRecord: '8-5' },

  // Sun night
  { homeTeam: 'Cowboys',      awayTeam: 'Vikings',     homeRecord: '6-6',  awayRecord: '5-8' },

  // Mon night
  { homeTeam: 'Steelers',     awayTeam: 'Dolphins',    homeRecord: '7-6',  awayRecord: '6-7' },
];

export const gameLabel = (g) => `${g.awayTeam} @ ${g.homeTeam}`;
export const norm = (s) => String(s ?? '').trim().toLowerCase();
