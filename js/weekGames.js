export const games = [
// Thu (Dec 25)
  { homeTeam: 'Commanders', awayTeam: 'Cowboys',   homeRecord: '4-11',  awayRecord: '6-8' },
  { homeTeam: 'Vikings',    awayTeam: 'Lions',     homeRecord: '7-8',   awayRecord: '8-7' },
  { homeTeam: 'Chiefs',     awayTeam: 'Broncos',   homeRecord: '6-9',   awayRecord: '12-3' },

  // Sat (Dec 27)
  { homeTeam: 'Chargers',   awayTeam: 'Texans',    homeRecord: '11-4',  awayRecord: '10-5' },
  { homeTeam: 'Packers',    awayTeam: 'Ravens',    homeRecord: '9-5',   awayRecord: '7-8' },

  // Sun early (Dec 28)
  { homeTeam: 'Dolphins',   awayTeam: 'Buccaneers',homeRecord: '6-9',   awayRecord: '7-8' },
  { homeTeam: 'Jets',       awayTeam: 'Patriots',  homeRecord: '3-12',  awayRecord: '12-3' },
  { homeTeam: 'Browns',     awayTeam: 'Steelers',  homeRecord: '3-12',  awayRecord: '9-6' },
  { homeTeam: 'Bengals',    awayTeam: 'Cardinals', homeRecord: '5-10',  awayRecord: '3-12' },
  { homeTeam: 'Titans',     awayTeam: 'Saints',    homeRecord: '3-12',  awayRecord: '5-10' },
  { homeTeam: 'Colts',      awayTeam: 'Jaguars',   homeRecord: '8-7',   awayRecord: '11-4' },
  { homeTeam: 'Panthers',   awayTeam: 'Seahawks',  homeRecord: '8-7',   awayRecord: '12-3' },

  // Sun late (Dec 28)
  { homeTeam: 'Raiders',    awayTeam: 'Giants',    homeRecord: '2-13',  awayRecord: '2-13' },
  { homeTeam: 'Bills',      awayTeam: 'Eagles',    homeRecord: '11-4',  awayRecord: '10-5' },

  // Sun night (Dec 28)
  { homeTeam: '49ers',      awayTeam: 'Bears',     homeRecord: '11-4',  awayRecord: '11-4' },

  // Mon night (Dec 29)
  { homeTeam: 'Falcons',    awayTeam: 'Rams',      homeRecord: '6-9',   awayRecord: '11-4' },
];

export const gameLabel = (g) => `${g.awayTeam} @ ${g.homeTeam}`;
export const norm = (s) => String(s ?? '').trim().toLowerCase();
