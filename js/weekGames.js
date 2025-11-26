export const games = [
  // Thu (Thanksgiving)
  { homeTeam: 'Lions',        awayTeam: 'Packers',     homeRecord: '7-4',  awayRecord: '7-3' },
  { homeTeam: 'Cowboys',      awayTeam: 'Chiefs',      homeRecord: '5-5',  awayRecord: '6-5' },
  { homeTeam: 'Ravens',       awayTeam: 'Bengals',     homeRecord: '6-5',  awayRecord: '3-8' },

  // Fri (Black Friday)
  { homeTeam: 'Eagles',       awayTeam: 'Bears',       homeRecord: '8-3',  awayRecord: '8-3' },

  // Sun early
  { homeTeam: 'Titans',       awayTeam: 'Jaguars',     homeRecord: '1-10', awayRecord: '7-4' },
  { homeTeam: 'Jets',         awayTeam: 'Falcons',     homeRecord: '2-9',  awayRecord: '4-7' },
  { homeTeam: 'Panthers',     awayTeam: 'Rams',        homeRecord: '6-6',  awayRecord: '9-2' },
  { homeTeam: 'Dolphins',     awayTeam: 'Saints',      homeRecord: '4-7',  awayRecord: '2-9' },
  { homeTeam: 'Buccaneers',   awayTeam: 'Cardinals',   homeRecord: '6-5',  awayRecord: '3-8' },
  { homeTeam: 'Browns',       awayTeam: '49ers',       homeRecord: '3-8',  awayRecord: '8-4' },
  { homeTeam: 'Colts',        awayTeam: 'Texans',      homeRecord: '8-3',  awayRecord: '6-5' },

  // Sun late
  { homeTeam: 'Seahawks',     awayTeam: 'Vikings',     homeRecord: '8-3',  awayRecord: '4-7' },
  { homeTeam: 'Steelers',     awayTeam: 'Bills',       homeRecord: '6-5',  awayRecord: '7-4' },
  { homeTeam: 'Chargers',     awayTeam: 'Raiders',     homeRecord: '7-4',  awayRecord: '2-9' },

  // Sun night
  { homeTeam: 'Commanders',   awayTeam: 'Broncos',     homeRecord: '3-8',  awayRecord: '9-2' },

  // Mon night
  { homeTeam: 'Patriots',     awayTeam: 'Giants',      homeRecord: '10-2', awayRecord: '2-10' },
];


export const gameLabel = (g) => `${g.awayTeam} @ ${g.homeTeam}`;
export const norm = (s) => String(s ?? '').trim().toLowerCase();
