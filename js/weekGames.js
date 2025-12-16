export const games = [
// Thu
  { homeTeam: 'Seahawks',    awayTeam: 'Rams',        homeRecord: '11-3',  awayRecord: '11-3' },

  // Sat
  { homeTeam: 'Commanders',  awayTeam: 'Eagles',      homeRecord: '4-10',  awayRecord: '9-5' },
  { homeTeam: 'Bears',       awayTeam: 'Packers',     homeRecord: '10-4',  awayRecord: '9-4-1' },

  // Sun early (1:00 ET)
  { homeTeam: 'Browns',      awayTeam: 'Bills',       homeRecord: '3-11',  awayRecord: '10-4' },
  { homeTeam: 'Cowboys',     awayTeam: 'Chargers',    homeRecord: '6-7-1', awayRecord: '10-4' },
  { homeTeam: 'Titans',      awayTeam: 'Chiefs',      homeRecord: '2-12',  awayRecord: '6-8' },
  { homeTeam: 'Dolphins',    awayTeam: 'Bengals',     homeRecord: '6-8',   awayRecord: '4-10' },
  { homeTeam: 'Saints',      awayTeam: 'Jets',        homeRecord: '4-10',  awayRecord: '3-11' },
  { homeTeam: 'Giants',      awayTeam: 'Vikings',     homeRecord: '2-12',  awayRecord: '6-8' },
  { homeTeam: 'Panthers',    awayTeam: 'Buccaneers',  homeRecord: '7-7',   awayRecord: '7-7' },

  // Sun late
  { homeTeam: 'Broncos',     awayTeam: 'Jaguars',     homeRecord: '12-2',  awayRecord: '10-4' }, // 4:05 ET
  { homeTeam: 'Cardinals',   awayTeam: 'Falcons',     homeRecord: '3-11',  awayRecord: '5-9' },  // 4:05 ET
  { homeTeam: 'Lions',       awayTeam: 'Steelers',    homeRecord: '8-6',   awayRecord: '8-6' },  // 4:25 ET
  { homeTeam: 'Texans',      awayTeam: 'Raiders',     homeRecord: '9-5',   awayRecord: '2-12' }, // 4:25 ET

  // Sun night
  { homeTeam: 'Ravens',      awayTeam: 'Patriots',    homeRecord: '7-7',   awayRecord: '11-3' },

  // Mon night
  { homeTeam: 'Colts',       awayTeam: '49ers',       homeRecord: '8-6',   awayRecord: '10-4' },
];

export const gameLabel = (g) => `${g.awayTeam} @ ${g.homeTeam}`;
export const norm = (s) => String(s ?? '').trim().toLowerCase();
