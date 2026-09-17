function factorial(n) {
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
}

// The Poisson probability mass function: given an expected rate lambda,
// the probability of observing exactly k events.
function poissonProbability(lambda, k) {
  return (Math.exp(-lambda) * Math.pow(lambda, k)) / factorial(k);
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function pct(value, decimals) {
  return `${(value * 100).toFixed(decimals)}%`;
}

function buildBarCell(value, maxValue, fillClass) {
  const width = maxValue > 0 ? (value / maxValue) * 100 : 0;
  return `<div class="bar-track"><div class="bar-fill ${fillClass}" style="width: ${width}%"></div></div><span class="bar-label">${pct(value, 1)}</span>`;
}

function buildLimitationTable(expected) {
  const body = document.getElementById("limitation-table-body");
  GOAL_VALUES.forEach((v) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td class="row-label">${v}</td>
      <td>${expected.countHome[v]}</td>
      <td>${pct(expected.probHome[v], 0)}</td>
    `;
    body.appendChild(row);
  });
}

function buildComparisonTable(expected, lambdaHome) {
  setText("comparison-lambda", lambdaHome.toFixed(2));
  setText("comparison-lambda-2", lambdaHome.toFixed(2));

  const poissonProbs = GOAL_VALUES.map((v) => poissonProbability(lambdaHome, v));
  const maxProb = Math.max(...GOAL_VALUES.map((v) => expected.probHome[v]), ...poissonProbs);

  const body = document.getElementById("comparison-table-body");
  GOAL_VALUES.forEach((v, i) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td class="row-label">${v}</td>
      <td>${buildBarCell(expected.probHome[v], maxProb, "")}</td>
      <td>${buildBarCell(poissonProbs[i], maxProb, "poisson")}</td>
    `;
    body.appendChild(row);
  });

  setText("comparison-p5", pct(poissonProbability(lambdaHome, 5), 1));
}

function buildWorkedExample(lambdaHome, lambdaAway) {
  const pHome1 = poissonProbability(lambdaHome, 1);
  const pAway0 = poissonProbability(lambdaAway, 0);
  const pScoreline = pHome1 * pAway0;

  setText("worked-p-home1", pHome1.toFixed(4));
  setText("worked-p-home1-2", pHome1.toFixed(4));
  setText("worked-lambda-away", lambdaAway.toFixed(2));
  setText("worked-p-away0", pAway0.toFixed(4));
  setText("worked-p-away0-2", pAway0.toFixed(4));
  setText("worked-p10", pScoreline.toFixed(4));
  setText("worked-p10-pct", pct(pScoreline, 2));
}

const expected = computeGoalStats();
const homeGoalsTotal = MATCH_HISTORY.reduce((sum, m) => sum + m.home, 0);
const awayGoalsTotal = MATCH_HISTORY.reduce((sum, m) => sum + m.away, 0);
const lambdaHome = homeGoalsTotal / MATCH_HISTORY.length;
const lambdaAway = awayGoalsTotal / MATCH_HISTORY.length;

setText("ex-home-count", expected.countHome[1]);
setText("ex-home-count-2", expected.countHome[1]);
setText("ex-home-prob", expected.probHome[1].toFixed(2));

setText("lambda-home-total", homeGoalsTotal);
setText("lambda-home-total-2", homeGoalsTotal);
setText("lambda-home", lambdaHome.toFixed(2));
setText("lambda-away-total", awayGoalsTotal);
setText("lambda-away-total-2", awayGoalsTotal);
setText("lambda-away", lambdaAway.toFixed(2));

buildLimitationTable(expected);
buildComparisonTable(expected, lambdaHome);
buildWorkedExample(lambdaHome, lambdaAway);
