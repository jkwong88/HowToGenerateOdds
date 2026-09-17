function buildCorrectScoreEntries() {
  const entries = [];
  MATRIX_GOAL_VALUES.forEach((home) => {
    MATRIX_GOAL_VALUES.forEach((away) => {
      entries.push({ key: `${home}-${away}`, label: `${home}:${away}`, home, away, isAOS: false });
    });
  });
  entries.push({ key: "aos", label: "AOS", isAOS: true });
  return entries;
}

// Away == 0 is the exercise's core: those cells start editable, everything
// else (Away 1-4, AOS) starts hidden and disabled until the core is solved.
function isCoreEntry(entry) {
  return !entry.isAOS && entry.away === 0;
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
  MATRIX_GOAL_VALUES.forEach((v) => {
    header.innerHTML += `<th>${v}</th>`;
  });

  const body = document.getElementById("final-matrix-body");
  MATRIX_GOAL_VALUES.forEach((home) => {
    const row = document.createElement("tr");
    let cells = `<td class="row-label">${home}</td>`;
    MATRIX_GOAL_VALUES.forEach((away) => {
      cells += `<td class="given-value" data-cell="final-matrix:${home}-${away}">${matrixExpected(expected, home, away).toFixed(2)}</td>`;
    });
    row.innerHTML = cells;
    body.appendChild(row);
  });
}

// Correct Score table is split into 3 smaller tables by Home score so no
// single table needs 26 columns.
const SCORE_TABLE_GROUPS = [
  { homeValues: [0, 1], includeAOS: false },
  { homeValues: [2, 3], includeAOS: false },
  { homeValues: [4], includeAOS: true },
];

function buildScoreTable(stats) {
  const container = document.getElementById("score-tables");
  const nonAosRefs = stats.entries
    .filter((entry) => !entry.isAOS)
    .map((entry) => `score-prob:${entry.key}`)
    .join(",");

  SCORE_TABLE_GROUPS.forEach((group, index) => {
    const groupEntries = stats.entries.filter((entry) =>
      entry.isAOS ? group.includeAOS : group.homeValues.includes(entry.home)
    );

    const wrapper = document.createElement("div");
    wrapper.className = "score-group table-scroll";
    wrapper.innerHTML = `
      <table>
        <thead>
          <tr id="score-header-${index}"><th>Score</th></tr>
        </thead>
        <tbody>
          <tr id="score-prob-row-${index}"><td class="row-label">Probability</td></tr>
          <tr id="score-odds-row-${index}"><td class="row-label">Euro Odds</td></tr>
        </tbody>
      </table>
    `;
    container.appendChild(wrapper);

    const header = wrapper.querySelector(`#score-header-${index}`);
    const probRow = wrapper.querySelector(`#score-prob-row-${index}`);
    const oddsRow = wrapper.querySelector(`#score-odds-row-${index}`);

    groupEntries.forEach((entry) => {
      header.innerHTML += `<th>${entry.label}</th>`;

      const isCore = isCoreEntry(entry);

      const probFormula = entry.isAOS
        ? "1 &minus; SUM(all other probabilities)"
        : `Matrix(Home = ${entry.home}, Away = ${entry.away})`;
      const probRefs = entry.isAOS ? nonAosRefs : `final-matrix:${entry.key}`;
      const probAttrs = isCore ? ` data-refs="${probRefs}"` : " disabled";
      probRow.innerHTML += `<td data-cell="score-prob:${entry.key}"><input class="answer" type="number" step="0.01" id="score-prob-${entry.key}" data-formula="${probFormula}"${probAttrs}></td>`;

      const oddsUndefined = isUndefinedOdds(stats.probByKey[entry.key]);
      let oddsAttrs;
      if (!isCore) {
        oddsAttrs = " disabled";
      } else if (oddsUndefined) {
        oddsAttrs = ' disabled placeholder="N/A"';
      } else {
        oddsAttrs = ` data-refs="score-prob:${entry.key}"`;
      }
      oddsRow.innerHTML += `<td><input class="answer" type="number" step="0.01" id="score-odds-${entry.key}" data-formula="1 / Probability"${oddsAttrs}></td>`;
    });
  });
}

function hideEntry(entry) {
  [`score-prob-${entry.key}`, `score-odds-${entry.key}`].forEach((id) => {
    const input = document.getElementById(id);
    input.value = "";
    input.classList.remove("correct", "incorrect");
    setCellTooltip(input, "");
    input.disabled = true;
  });
}

function hideNonCoreEntries(stats) {
  stats.entries.forEach((entry) => {
    if (!isCoreEntry(entry)) hideEntry(entry);
  });
}

function revealEntry(stats, entry) {
  const prob = stats.probByKey[entry.key];
  const probInput = document.getElementById(`score-prob-${entry.key}`);
  probInput.value = prob.toFixed(2);
  markInput(probInput, prob, 0.005, 2);
  probInput.disabled = true;

  const oddsInput = document.getElementById(`score-odds-${entry.key}`);
  if (isUndefinedOdds(prob)) {
    oddsInput.value = "";
    oddsInput.placeholder = "N/A";
    setCellTooltip(oddsInput, "");
  } else {
    oddsInput.value = (1 / prob).toFixed(2);
    markInput(oddsInput, 1 / prob, 0.005, 2);
  }
  oddsInput.disabled = true;
}

function revealNonCoreEntries(stats) {
  stats.entries.forEach((entry) => {
    if (!isCoreEntry(entry)) revealEntry(stats, entry);
  });
}

function checkCoreEntries(stats) {
  const results = [];

  stats.entries.forEach((entry) => {
    if (!isCoreEntry(entry)) return;
    const prob = stats.probByKey[entry.key];
    results.push(markInput(document.getElementById(`score-prob-${entry.key}`), prob, 0.005, 2));

    if (!isUndefinedOdds(prob)) {
      results.push(markInput(document.getElementById(`score-odds-${entry.key}`), 1 / prob, 0.005, 2));
    }
  });

  return results.every(Boolean);
}

function checkScoreTable(stats) {
  const passed = checkCoreEntries(stats);
  if (passed) revealNonCoreEntries(stats);
  return passed;
}

function fillScoreTable(stats) {
  stats.entries.forEach((entry) => {
    if (!isCoreEntry(entry)) return;
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
  hideNonCoreEntries(scoreStats);
}

const expected = computeGoalStats();
const scoreStats = computeScoreStats(expected);

buildFinalMatrixTable(expected);
buildScoreTable(scoreStats);

document.querySelectorAll("input.answer").forEach((input) => {
  syncEmptyTooltip(input);
  input.addEventListener("input", () => syncEmptyTooltip(input));
  attachRefHighlight(input);
});

hideNonCoreEntries(scoreStats);

document.getElementById("check-score").addEventListener("click", () => checkScoreTable(scoreStats));
document.getElementById("fill-score").addEventListener("click", () => fillScoreTable(scoreStats));
document.getElementById("reset-btn").addEventListener("click", resetAll);
