export const games = [
// Thu
  { homeTeam: 'Patriots',     awayTeam: 'Jets',        homeRecord: '8-2', awayRecord: '2-7' },

  // Sun early
  { homeTeam: 'Dolphins',     awayTeam: 'Commanders',  homeRecord: '3-7', awayRecord: '3-7' },
  { homeTeam: 'Jaguars',      awayTeam: 'Chargers',    homeRecord: '5-4', awayRecord: '7-3' },
  { homeTeam: 'Bills',        awayTeam: 'Buccaneers',  homeRecord: '6-3', awayRecord: '6-3' },
  { homeTeam: 'Vikings',      awayTeam: 'Bears',       homeRecord: '4-5', awayRecord: '6-3' },
  { homeTeam: 'Giants',       awayTeam: 'Packers',     homeRecord: '2-8', awayRecord: '5-3' },
  { homeTeam: 'Titans',       awayTeam: 'Texans',      homeRecord: '1-8', awayRecord: '4-5' },
  { homeTeam: 'Falcons',      awayTeam: 'Panthers',    homeRecord: '3-6', awayRecord: '5-5' },
  { homeTeam: 'Steelers',     awayTeam: 'Bengals',     homeRecord: '5-4', awayRecord: '3-6' },

  // Sun late
  { homeTeam: 'Cardinals',    awayTeam: '49ers',       homeRecord: '3-6', awayRecord: '6-4' },  // 4:05 ET
  { homeTeam: 'Rams',         awayTeam: 'Seahawks',    homeRecord: '7-2', awayRecord: '7-2' },  // 4:05 ET
  { homeTeam: 'Broncos',      awayTeam: 'Chiefs',      homeRecord: '8-2', awayRecord: '5-4' },  // 4:25 ET
  { homeTeam: 'Browns',       awayTeam: 'Ravens',      homeRecord: '2-7', awayRecord: '4-5' },  // 4:25 ET

  // Sun night
  { homeTeam: 'Eagles',       awayTeam: 'Lions',       homeRecord: '7-2', awayRecord: '6-3' },

  // Mon night
  { homeTeam: 'Raiders',      awayTeam: 'Cowboys',     homeRecord: '2-7', awayRecord: '3-5' },
];


export const gameLabel = (g) => `${g.awayTeam} @ ${g.homeTeam}`;
export const norm = (s) => String(s ?? '').trim().toLowerCase();
