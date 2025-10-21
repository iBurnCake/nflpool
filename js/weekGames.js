export const games = [
  // Thu
  { homeTeam: 'Chargers',    awayTeam: 'Vikings',     homeRecord: '4-3', awayRecord: '3-3' },

  // Sun early
  { homeTeam: 'Bengals',     awayTeam: 'Jets',        homeRecord: '3-4', awayRecord: '0-7' },
  { homeTeam: 'Panthers',    awayTeam: 'Bills',       homeRecord: '4-3', awayRecord: '4-2' },
  { homeTeam: 'Texans',      awayTeam: '49ers',       homeRecord: '2-4', awayRecord: '5-2' },
  { homeTeam: 'Eagles',      awayTeam: 'Giants',      homeRecord: '5-2', awayRecord: '2-5' },
  { homeTeam: 'Patriots',    awayTeam: 'Browns',      homeRecord: '5-2', awayRecord: '2-5' },
  { homeTeam: 'Ravens',      awayTeam: 'Bears',       homeRecord: '1-5', awayRecord: '4-2' },
  { homeTeam: 'Falcons',     awayTeam: 'Dolphins',    homeRecord: '3-3', awayRecord: '1-6' },

  // Sun late window
  { homeTeam: 'Saints',      awayTeam: 'Buccaneers',  homeRecord: '1-6', awayRecord: '5-2' }, // 4:05 ET
  { homeTeam: 'Broncos',     awayTeam: 'Cowboys',     homeRecord: '5-2', awayRecord: '3-3' }, // 4:25 ET
  { homeTeam: 'Colts',       awayTeam: 'Titans',      homeRecord: '6-1', awayRecord: '1-6' }, // 4:25 ET

  // Sun night
  { homeTeam: 'Steelers',    awayTeam: 'Packers',     homeRecord: '4-2', awayRecord: '4-1' },

  // Mon night
  { homeTeam: 'Chiefs',      awayTeam: 'Commanders',  homeRecord: '4-3', awayRecord: '3-4' },
];


export const gameLabel = (g) => `${g.awayTeam} @ ${g.homeTeam}`;
export const norm = (s) => String(s ?? '').trim().toLowerCase();
