// Shared fixed dataset reused across all exercise pages.
const MATCH_HISTORY = [
  { no: 1, home: 1, away: 2 },
  { no: 2, home: 4, away: 1 },
  { no: 3, home: 1, away: 2 },
  { no: 4, home: 1, away: 1 },
  { no: 5, home: 2, away: 4 },
  { no: 6, home: 0, away: 1 },
  { no: 7, home: 2, away: 0 },
  { no: 8, home: 1, away: 0 },
  { no: 9, home: 0, away: 0 },
  { no: 10, home: 3, away: 1 },
];

const GOAL_VALUES = [0, 1, 2, 3, 4, 5, 6];

function countByValue(goals, value) {
  return goals.filter((g) => g === value).length;
}

// Shared derived stats (counts, averages, probabilities) from MATCH_HISTORY,
// reused by every exercise page so the numbers stay consistent across pages.
function computeGoalStats() {
  const homeGoals = MATCH_HISTORY.map((m) => m.home);
  const awayGoals = MATCH_HISTORY.map((m) => m.away);
  const totals = MATCH_HISTORY.map((m) => m.home + m.away);

  const expectedTotals = {};
  MATCH_HISTORY.forEach((m, i) => {
    expectedTotals[m.no] = totals[i];
  });

  const avgHome = homeGoals.reduce((a, b) => a + b, 0) / homeGoals.length;
  const avgAway = awayGoals.reduce((a, b) => a + b, 0) / awayGoals.length;
  const avgTotal = totals.reduce((a, b) => a + b, 0) / totals.length;

  const countHome = {};
  const countAway = {};
  const countTotal = {};
  GOAL_VALUES.forEach((v) => {
    countHome[v] = countByValue(homeGoals, v);
    countAway[v] = countByValue(awayGoals, v);
    countTotal[v] = countByValue(totals, v);
  });

  const probHome = {};
  const probAway = {};
  const probTotal = {};
  GOAL_VALUES.forEach((v) => {
    probHome[v] = countHome[v] / homeGoals.length;
    probAway[v] = countAway[v] / awayGoals.length;
    probTotal[v] = countTotal[v] / totals.length;
  });

  return {
    expectedTotals,
    avgHome,
    avgAway,
    avgTotal,
    countHome,
    countAway,
    countTotal,
    probHome,
    probAway,
    probTotal,
  };
}
