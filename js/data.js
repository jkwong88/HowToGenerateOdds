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

  const countHome = {};
  const countAway = {};
  GOAL_VALUES.forEach((v) => {
    countHome[v] = countByValue(homeGoals, v);
    countAway[v] = countByValue(awayGoals, v);
  });

  const probHome = {};
  const probAway = {};
  GOAL_VALUES.forEach((v) => {
    probHome[v] = countHome[v] / homeGoals.length;
    probAway[v] = countAway[v] / awayGoals.length;
  });

  return {
    countHome,
    countAway,
    probHome,
    probAway,
  };
}

// Joint probability of an exact scoreline, assuming Home/Away goals are independent.
function matrixExpected(expected, home, away) {
  return expected.probHome[home] * expected.probAway[away];
}

// Shared Over/Under point math, used by every OU-flavored exercise page
// (and, via HDP, by any exercise classifying Home - Away instead of
// Home + Away - see docs/adr/0002-generalize-point-type-math-for-hdp.md).
//
// A whole-number point (e.g. 2) can push - Push is a real, refundable
// outcome. A .25/.75 point is really half stake at the line below and half
// at the line above, so the scoreline sitting on the rounded point is a
// genuine half win/half lose, not a push. A .5 point never lands on the
// line at all, so there's no third category.
function getPointType(point) {
  // Math.abs() so a negative point (HDP's Home - Away axis) still lands on
  // the same integer/half/quarter case as its positive mirror.
  const frac = Math.round((Math.abs(point) % 1) * 100) / 100;
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
//
// Expressed as "does point sit above or below its rounded pivot" rather
// than a raw modulo check, so it also works for a negative point (HDP):
// point > pivot means the pivot is the lower of the two half-lines the
// quarter point splits into (mirroring the +0.25 case below), regardless
// of sign.
function primaryBetTeamKey(point) {
  if (getPointType(point) !== "quarter") return null;
  const pivot = Math.round(point);
  return point > pivot ? "over" : "under";
}

// Raw Under/Over/middle probabilities for a given point, summed straight
// from the Home x Away matrix - parameterized by which axis to classify, so
// HDP can reuse it for Home - Away instead of Over/Under's Home + Away (see
// docs/adr/0002-generalize-point-type-math-for-hdp.md).
function computeCategoryProbabilities(expected, point, axisValue) {
  const prob = { under: 0, over: 0 };
  if (hasMiddleCategory(point)) prob.middle = 0;

  MATRIX_GOAL_VALUES.forEach((home) => {
    MATRIX_GOAL_VALUES.forEach((away) => {
      const p = matrixExpected(expected, home, away);
      prob[classifyTotal(axisValue(home, away), point)] += p;
    });
  });

  return prob;
}

function computeHDPCategoryProbabilities(expected, point) {
  return computeCategoryProbabilities(expected, point, (home, away) => home - away);
}

// The bettable ("BetTeam") probability for Under/Over at a given point,
// given its raw category probabilities (as returned by
// computeCategoryProbabilities). Excludes the middle category per
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

// Adapts a {cat: {prob, refs}} stats map (as built by each market page's
// compute*Stats) into the plain {cat: prob} shape ouBetTeamProbability
// expects, so pages don't each hand-roll the same adapter.
function betTeamProbabilityFromStats(stats, point, key) {
  const prob = {};
  Object.keys(stats).forEach((k) => {
    prob[k] = stats[k].prob;
  });
  return ouBetTeamProbability(prob, point, key);
}

// The category list and middle-category display data for a point-type-aware
// (integer/half/quarter) market - shared by every Under/Middle/Over-style
// exercise (Over/Under, HDP, and the section-4 sweep/spread pages).
function getCategories(point) {
  return hasMiddleCategory(point) ? ["under", "middle", "over"] : ["under", "over"];
}

function pivotForDisplay(point) {
  return hasMiddleCategory(point) ? Math.round(point) : point;
}

// The short, single-word/phrase name for the middle category's paint button
// and "click X" instruction: an integer point pushes (caller supplies the
// word - "Push" for both Over/Under and HDP), which is symmetric enough for
// one word. A quarter point's pivot settles the two sides *oppositely* (see
// getMiddleLabel below), so there's no single correct side-word for a
// button whose only job is "paint these cells" - "Split Settlement" names
// the category itself (neither side settles it the same way) rather than
// picking a side.
function getMiddleActionLabel(point, integerLabel) {
  return getPointType(point) === "integer" ? integerLabel : "Split Settlement";
}

// A quarter point's pivot settles the two bettable sides *oppositely*
// (whichever sits above its pivot - the same rule as primaryBetTeamKey - is
// a Half Loss, the other a Half Win), so this can't be named from a single
// scoreline's perspective; both sides have to be given their own word.
function getSplitSettlementWords(point) {
  const pivot = Math.round(point);
  const overIsHalfLoss = point > pivot;
  return {
    overWord: overIsHalfLoss ? "Half Loss" : "Half Win",
    underWord: overIsHalfLoss ? "Half Win" : "Half Loss",
  };
}

// The full, disambiguated description of the middle category, for display
// (table header, formula text) rather than the button above.
function getMiddleLabel(point, integerLabel, sideLabels) {
  const type = getPointType(point);
  if (type === "integer") return integerLabel;
  const { overWord, underWord } = getSplitSettlementWords(point);
  return `${sideLabels.over}: ${overWord} / ${sideLabels.under}: ${underWord}`;
}

// The dropdown/sweep shows the standard Asian Handicap line applied to Home
// (negative = Home favorite/giving goals, positive = Home underdog/getting
// goals). classifyTotal/etc. compare Home - Away directly against a point,
// so the line has to be negated first: Home covers a line L when
// (Home - Away) > -L, i.e. when Home - Away > hdpLineToPoint(L).
function hdpLineToPoint(line) {
  return -line;
}

// Shared axis/label config for pages that toggle between Over/Under and
// Handicap (4.1 Opening the Market, 4.2 Adding a Spread) - only each page's
// own sweep range/fixed value/title differ; the axis math and BetTeam
// labels are identical either way.
const MARKET_AXIS_CONFIGS = {
  ou: {
    classifyPoint: (value) => value,
    axisValue: (home, away) => home + away,
    labels: { over: "Over", under: "Under" },
  },
  hdp: {
    classifyPoint: hdpLineToPoint,
    axisValue: (home, away) => home - away,
    labels: { over: "Home Covers", under: "Away Covers" },
  },
};

// Only a genuinely zero probability has no odds - a small non-zero
// probability (even one that rounds to 0.00 at 2-decimal display precision)
// still has a real, if very large, fair odds value (e.g. P = 0.004 -> 250).
function isUndefinedOdds(prob) {
  return prob === 0;
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

// Real Malay odds are always quoted with |Malay| <= 1 (that's what toMalay's
// own branches always produce) - a value outside that range only ever shows
// up here after arithmetic on an already-converted Malay (adding-a-spread.js
// subtracts a spread from the fair Malay directly), and isn't a valid quote.
// Re-expressing it via the same invert-and-flip-sign transform as
// toMalay/malayToHK (just triggered by magnitude instead of a sign check)
// gives the equivalent, correctly-notated value - malayToHK(malay) and
// malayToHK(normalizeMalay(malay)) always agree, so downstream HK/Euro/
// Probability are unaffected either way; only the displayed Malay changes.
function normalizeMalay(malay) {
  return Math.abs(malay) > 1 ? -1 / malay : malay;
}
