export const games = [
  // Thu
  { homeTeam: 'Steelers',     awayTeam: 'Bengals',     homeRecord: '4-1',   awayRecord: '2-4' },

  // Sun 9:30 AM (Intl)
  { homeTeam: 'Rams',         awayTeam: 'Jaguars',     homeRecord: '4-2',   awayRecord: '4-2' },

  // Sun 1:00 PM
  { homeTeam: 'Eagles',       awayTeam: 'Vikings',     homeRecord: '4-2',   awayRecord: '3-2' },
  { homeTeam: 'Patriots',     awayTeam: 'Titans',      homeRecord: '4-2',   awayRecord: '1-5' },
  { homeTeam: 'Panthers',     awayTeam: 'Jets',        homeRecord: '3-3',   awayRecord: '0-6' },
  { homeTeam: 'Dolphins',     awayTeam: 'Browns',      homeRecord: '1-5',   awayRecord: '1-5' },
  { homeTeam: 'Saints',       awayTeam: 'Bears',       homeRecord: '1-5',   awayRecord: '3-2' },
  { homeTeam: 'Raiders',      awayTeam: 'Chiefs',      homeRecord: '2-4',   awayRecord: '3-3' },

  // Sun late window
  { homeTeam: 'Colts',        awayTeam: 'Chargers',    homeRecord: '5-1',   awayRecord: '4-2' },
  { homeTeam: 'Giants',       awayTeam: 'Broncos',     homeRecord: '2-4',   awayRecord: '4-2' },
  { homeTeam: 'Packers',      awayTeam: 'Cardinals',   homeRecord: '3-1',   awayRecord: '2-4' },
  { homeTeam: 'Commanders',   awayTeam: 'Cowboys',     homeRecord: '3-3',   awayRecord: '2-3' },

  // Sun night
  { homeTeam: 'Falcons',      awayTeam: '49ers',       homeRecord: '3-2',   awayRecord: '4-2' },

  // Mon
  { homeTeam: 'Buccaneers',   awayTeam: 'Lions',       homeRecord: '5-1',   awayRecord: '4-2' },
  { homeTeam: 'Texans',       awayTeam: 'Seahawks',    homeRecord: '2-3',   awayRecord: '4-2' },
];


export const gameLabel = (g) => `${g.awayTeam} @ ${g.homeTeam}`;
export const norm = (s) => String(s ?? '').trim().toLowerCase();
