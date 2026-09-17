// Shared fixed dataset reused across all exercise pages.
const MATCH_HISTORY = [
  { no: 1, home: 1, away: 2 },
  { no: 2, home: 4, away: 1 },
  { no: 3, home: 1, away: 2 },
  { no: 4, home: 1, away: 3 },
  { no: 5, home: 2, away: 4 },
  { no: 6, home: 0, away: 1 },
  { no: 7, home: 2, away: 0 },
  { no: 8, home: 1, away: 0 },
  { no: 9, home: 0, away: 0 },
  { no: 10, home: 3, away: 1 },
];

const GOAL_VALUES = [0, 1, 2, 3, 4, 5, 6];

// Individual team goals never reach 5 or 6 in this dataset (unlike combined
// match totals, which do), so the Home x Away matrix tables only need this
// narrower range.
const MATRIX_GOAL_VALUES = [0, 1, 2, 3, 4];

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

// Joint probability of an exact scoreline, assuming Home/Away goals are independent.
function matrixExpected(expected, home, away) {
  return expected.probHome[home] * expected.probAway[away];
}

// Shared Over/Under point math, used by every OU-flavored exercise page.
//
// A whole-number point (e.g. 2) can push - Draw is a real, refundable
// outcome. A .25/.75 point is really half stake at the line below and half
// at the line above, so the scoreline sitting on the rounded point is a
// genuine half win/half lose, not a push. A .5 point never lands on the
// line at all, so there's no third category.
function getPointType(point) {
  const frac = Math.round((point % 1) * 100) / 100;
  if (frac === 0) return "integer";
  if (frac === 0.5) return "half";
  return "quarter";
}

function hasMiddleCategory(point) {
  return getPointType(point) !== "half";
}

// The share of the middle category's probability excluded from the
// bettable price: a push is excluded entirely (weight 1), a half win/half
// lose only half-excluded (weight 0.5, matching y1 = x1/(x1 + 0.5*x2 + x3)),
// and there is nothing to exclude at a half point (weight 0).
function middleWeight(point) {
  const type = getPointType(point);
  if (type === "integer") return 1;
  if (type === "quarter") return 0.5;
  return 0;
}

function classifyTotal(total, point) {
  if (!hasMiddleCategory(point)) {
    return total < point ? "under" : "over";
  }
  const pivot = Math.round(point);
  if (total < pivot) return "under";
  if (total > pivot) return "over";
  return "middle";
}

// At a quarter point, "over/(over + 0.5*middle + under)" and its Under
// mirror do NOT sum to 1 (they only would if middle were 0), so only one
// side is actually derived from the EV formula - Over directly at a .25
// point, Under directly at a .75 point (the "lose half perspective") - and
// the other side is 1 minus that, so the two bettable outcomes always add
// up to exactly 1.
function primaryBetTeamKey(point) {
  if (getPointType(point) !== "quarter") return null;
  const frac = Math.round((point % 1) * 100) / 100;
  return frac === 0.25 ? "over" : "under";
}

// Raw Under/Over/middle probabilities for a given point, summed straight
// from the Home x Away matrix.
function computeOUCategoryProbabilities(expected, point) {
  const prob = { under: 0, over: 0 };
  if (hasMiddleCategory(point)) prob.middle = 0;

  MATRIX_GOAL_VALUES.forEach((home) => {
    MATRIX_GOAL_VALUES.forEach((away) => {
      const p = matrixExpected(expected, home, away);
      prob[classifyTotal(home + away, point)] += p;
    });
  });

  return prob;
}

// The bettable ("BetTeam") probability for Under/Over at a given point,
// given its raw category probabilities (as returned by
// computeOUCategoryProbabilities). Excludes the middle category per
// middleWeight(), and resolves the asymmetric quarter-point case via
// primaryBetTeamKey().
function ouBetTeamProbability(prob, point, key) {
  const middleProb = prob.middle || 0;
  const weight = middleWeight(point);

  function rawProb(k) {
    return prob[k] / (1 - weight * middleProb);
  }

  const primaryKey = primaryBetTeamKey(point);
  if (primaryKey && key !== primaryKey) {
    return 1 - rawProb(primaryKey);
  }
  return rawProb(key);
}

// A probability this small rounds to 0.00 at 2-decimal precision, so the
// "true odds" (1 / probability) are undefined rather than just very large.
function isUndefinedOdds(prob) {
  return Math.abs(prob) < 0.005;
}

// Shared odds conversion chain: True Probability -> Euro -> HK -> Malay.
function toEuro(prob) {
  return 1 / prob;
}

function toHK(euro) {
  return euro - 1;
}

function toMalay(hk) {
  return hk <= 1 ? hk : -1 / hk;
}

// Inverse of toMalay: HK<=1 maps to a non-negative Malay value, HK>1 to a
// negative one, so the sign of the Malay value (not its magnitude) is what
// tells us which branch to invert.
function malayToHK(malay) {
  return malay >= 0 ? malay : -1 / malay;
}
