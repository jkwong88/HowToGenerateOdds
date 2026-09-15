const CORRECT_SCORE_RANGE = [0, 1, 2, 3, 4];

function buildCorrectScoreEntries() {
  const entries = [];
  CORRECT_SCORE_RANGE.forEach((home) => {
    CORRECT_SCORE_RANGE.forEach((away) => {
      entries.push({ key: `${home}-${away}`, label: `${home}:${away}`, home, away, isAOS: false });
    });
  });
  entries.push({ key: "aos", label: "AOS", isAOS: true });
  return entries;
}

// A probability this small rounds to 0.00 at our 2-decimal precision, so the
// "true odds" (1 / probability) are undefined rather than just very large.
function isUndefinedOdds(prob) {
  return Math.abs(prob) < 0.005;
}

function computeScoreStats(expected) {
  const entries = buildCorrectScoreEntries();
  const probByKey = {};
  let sumProb = 0;

  entries.forEach((entry) => {
    if (entry.isAOS) return;
    const prob = matrixExpected(expected, entry.home, entry.away);
    probByKey[entry.key] = prob;
    sumProb += prob;
  });

  probByKey.aos = Math.max(0, 1 - sumProb);

  return { entries, probByKey };
}

function buildFinalMatrixTable(expected) {
  const header = document.getElementById("final-matrix-header");
  GOAL_VALUES.forEach((v) => {
    header.innerHTML += `<th>${v}</th>`;
  });

  const body = document.getElementById("final-matrix-body");
  GOAL_VALUES.forEach((home) => {
    const row = document.createElement("tr");
    let cells = `<td class="row-label">${home}</td>`;
    GOAL_VALUES.forEach((away) => {
      cells += `<td class="given-value">${matrixExpected(expected, home, away).toFixed(2)}</td>`;
    });
    row.innerHTML = cells;
    body.appendChild(row);
  });
}

function buildScoreTable(stats) {
  const header = document.getElementById("score-header");
  const probRow = document.getElementById("score-prob-row");
  const oddsRow = document.getElementById("score-odds-row");

  stats.entries.forEach((entry) => {
    header.innerHTML += `<th>${entry.label}</th>`;

    const probFormula = entry.isAOS
      ? "1 &minus; SUM(all other probabilities)"
      : `Matrix(Home=${entry.home}, Away=${entry.away})`;
    probRow.innerHTML += `<td><input class="answer" type="number" step="0.01" id="score-prob-${entry.key}" data-formula="${probFormula}"></td>`;

    const oddsUndefined = isUndefinedOdds(stats.probByKey[entry.key]);
    const oddsAttrs = oddsUndefined ? ' disabled placeholder="N/A"' : "";
    oddsRow.innerHTML += `<td><input class="answer" type="number" step="0.01" id="score-odds-${entry.key}" data-formula="1 / Probability"${oddsAttrs}></td>`;
  });
}

function checkScoreTable(stats) {
  const results = [];

  stats.entries.forEach((entry) => {
    const prob = stats.probByKey[entry.key];
    results.push(markInput(document.getElementById(`score-prob-${entry.key}`), prob, 0.005, 2));

    if (!isUndefinedOdds(prob)) {
      results.push(markInput(document.getElementById(`score-odds-${entry.key}`), 1 / prob, 0.005, 2));
    }
  });

  return results.every(Boolean);
}

function fillScoreTable(stats) {
  stats.entries.forEach((entry) => {
    const prob = stats.probByKey[entry.key];
    document.getElementById(`score-prob-${entry.key}`).value = prob.toFixed(2);
    if (!isUndefinedOdds(prob)) {
      document.getElementById(`score-odds-${entry.key}`).value = (1 / prob).toFixed(2);
    }
  });
  checkScoreTable(stats);
}

function resetAll() {
  document.querySelectorAll("input.answer").forEach((input) => {
    input.value = "";
    syncEmptyTooltip(input);
  });
}

const expected = computeGoalStats();
const scoreStats = computeScoreStats(expected);

buildFinalMatrixTable(expected);
buildScoreTable(scoreStats);

document.querySelectorAll("input.answer").forEach((input) => {
  syncEmptyTooltip(input);
  input.addEventListener("input", () => syncEmptyTooltip(input));
});

document.getElementById("check-score").addEventListener("click", () => checkScoreTable(scoreStats));
document.getElementById("fill-score").addEventListener("click", () => fillScoreTable(scoreStats));
document.getElementById("reset-btn").addEventListener("click", resetAll);
document.getElementById("toggle-formula-btn").addEventListener("click", toggleFormulaHover);
