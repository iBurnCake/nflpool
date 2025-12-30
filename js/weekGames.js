export const games = [
  // Sat
  { homeTeam: 'Buccaneers',  awayTeam: 'Panthers',   homeRecord: '7-9',   awayRecord: '8-8' },   // 4:30 ET
  { homeTeam: '49ers',       awayTeam: 'Seahawks',   homeRecord: '12-4',  awayRecord: '13-3' },  // 8:00 ET

  // Sun early (1:00 ET)
  { homeTeam: 'Vikings',     awayTeam: 'Packers',    homeRecord: '8-8',   awayRecord: '9-6-1' },
  { homeTeam: 'Bengals',     awayTeam: 'Browns',     homeRecord: '6-10',  awayRecord: '4-12' },
  { homeTeam: 'Texans',      awayTeam: 'Colts',      homeRecord: '11-5',  awayRecord: '8-8' },
  { homeTeam: 'Giants',      awayTeam: 'Cowboys',    homeRecord: '3-13',  awayRecord: '7-8-1' },
  { homeTeam: 'Falcons',     awayTeam: 'Saints',     homeRecord: '7-9',   awayRecord: '6-10' },
  { homeTeam: 'Jaguars',     awayTeam: 'Titans',     homeRecord: '12-4',  awayRecord: '3-13' },

  // Sun late (4:25 ET)
  { homeTeam: 'Broncos',     awayTeam: 'Chargers',   homeRecord: '13-3',  awayRecord: '11-5' },
  { homeTeam: 'Raiders',     awayTeam: 'Chiefs',     homeRecord: '2-14',  awayRecord: '6-10' },
  { homeTeam: 'Eagles',      awayTeam: 'Commanders', homeRecord: '11-5',  awayRecord: '4-12' },
  { homeTeam: 'Bills',       awayTeam: 'Jets',       homeRecord: '11-5',  awayRecord: '3-13' },
  { homeTeam: 'Patriots',    awayTeam: 'Dolphins',   homeRecord: '13-3',  awayRecord: '7-9' },
  { homeTeam: 'Rams',        awayTeam: 'Cardinals',  homeRecord: '11-5',  awayRecord: '3-13' },
  { homeTeam: 'Bears',       awayTeam: 'Lions',      homeRecord: '11-5',  awayRecord: '8-8' },

  // Sun night (8:20 ET)
  { homeTeam: 'Steelers',    awayTeam: 'Ravens',     homeRecord: '9-7',   awayRecord: '8-8' },
];

export const gameLabel = (g) => `${g.awayTeam} @ ${g.homeTeam}`;
export const norm = (s) => String(s ?? '').trim().toLowerCase();
