const CATEGORY_CLASS = { under: "marked-under", middle: "marked-middle", over: "marked-over" };
const BET_TEAM_KEYS = ["under", "over"];
const BET_TEAM_LABELS = { under: "Under", over: "Over" };

let ouPoint = 2.5;
let ouPhaseIndex = 0;
let ouStats = null;

function buildOUMatrixTable(expected) {
  const header = document.getElementById("ou-matrix-header");
  MATRIX_GOAL_VALUES.forEach((v) => {
    header.innerHTML += `<th>${v}</th>`;
  });

  const body = document.getElementById("ou-matrix-body");
  MATRIX_GOAL_VALUES.forEach((home) => {
    const row = document.createElement("tr");
    let cells = `<td class="row-label">${home}</td>`;
    MATRIX_GOAL_VALUES.forEach((away) => {
      const value = matrixExpected(expected, home, away).toFixed(2);
      cells += `<td><button type="button" class="oe-cell" id="ou-cell-${home}-${away}" data-cell="ou-cell:${home}-${away}">${value}</button></td>`;
    });
    row.innerHTML = cells;
    body.appendChild(row);
  });
}

// Clicking always paints with the current phase's color; if the cell already
// carries a different phase's color, the click replaces it instead of stacking.
function wireMatrixClicks() {
  MATRIX_GOAL_VALUES.forEach((home) => {
    MATRIX_GOAL_VALUES.forEach((away) => {
      const btn = document.getElementById(`ou-cell-${home}-${away}`);
      btn.addEventListener("click", () => {
        if (btn.disabled) return;
        btn.closest("td").classList.remove("cell-correct", "cell-wrong");
        const targetCategory = getCategories(ouPoint)[ouPhaseIndex];
        const targetClass = CATEGORY_CLASS[targetCategory];
        if (btn.classList.contains(targetClass)) {
          btn.classList.remove(targetClass);
        } else {
          Object.values(CATEGORY_CLASS).forEach((c) => btn.classList.remove(c));
          btn.classList.add(targetClass);
        }
      });
    });
  });
}

function updateStepUI() {
  const hasMiddle = hasMiddleCategory(ouPoint);
  const middleLabel = hasMiddle ? getMiddleLabel(ouPoint, "Draw") : "";
  const pivot = pivotForDisplay(ouPoint);

  document.getElementById("ou-step-2").style.display = hasMiddle ? "" : "none";
  document.getElementById("complete-middle").textContent = middleLabel;

  const note1 = document.getElementById("step-note-1");
  const note2 = document.getElementById("step-note-2");
  const note3 = document.getElementById("step-note-3");

  note1.innerHTML = `Step 1: click every cell where Home + Away is <strong>under ${pivot}</strong>, then click Under.`;

  if (hasMiddle) {
    note2.style.display = "";
    note2.innerHTML = `Step 2: click every cell where Home + Away <strong>equals ${pivot}</strong> (${middleLabel}), then click ${middleLabel}.`;
    note3.innerHTML = `Step 3: click every remaining cell (Home + Away is <strong>over ${pivot}</strong>), then click Over.`;
  } else {
    note2.style.display = "none";
    note3.innerHTML = `Step 2: click every remaining cell (Home + Away is <strong>over ${pivot}</strong>), then click Over.`;
  }
}

function updateStepHighlight() {
  const hasMiddle = hasMiddleCategory(ouPoint);
  const step2Locked = document.getElementById("ou-step-2").classList.contains("locked");
  const step3Locked = document.getElementById("ou-step-3").classList.contains("locked");
  const oddsLocked = document.getElementById("odds-section").classList.contains("locked");

  if (hasMiddle) {
    document.getElementById("step-note-1").classList.toggle("active", step2Locked);
    document.getElementById("step-note-2").classList.toggle("active", !step2Locked && step3Locked);
    document.getElementById("step-note-3").classList.toggle("active", !step3Locked && oddsLocked);
  } else {
    document.getElementById("step-note-1").classList.toggle("active", step3Locked);
    document.getElementById("step-note-2").classList.remove("active");
    document.getElementById("step-note-3").classList.toggle("active", !step3Locked && oddsLocked);
  }
}

// "Under" and the middle step just move to the next step - neither checks
// anything. If there's no middle category, "Under" jumps straight to step 3.
function completeUnder() {
  ouPhaseIndex = 1;
  if (hasMiddleCategory(ouPoint)) {
    unlockSection("ou-step-2");
  } else {
    unlockSection("ou-step-3");
  }
  updateStepHighlight();
}

function completeMiddle() {
  ouPhaseIndex = 2;
  unlockSection("ou-step-3");
  updateStepHighlight();
}

// "Over" is the only place the whole grid actually gets verified.
function checkAllCells() {
  let allCorrect = true;

  MATRIX_GOAL_VALUES.forEach((home) => {
    MATRIX_GOAL_VALUES.forEach((away) => {
      const btn = document.getElementById(`ou-cell-${home}-${away}`);
      const cell = btn.closest("td");
      const correctClass = CATEGORY_CLASS[classifyTotal(home + away, ouPoint)];
      const isCorrect = btn.classList.contains(correctClass);
      cell.classList.toggle("cell-correct", isCorrect);
      cell.classList.toggle("cell-wrong", !isCorrect);
      if (!isCorrect) allCorrect = false;
    });
  });

  if (allCorrect) {
    MATRIX_GOAL_VALUES.forEach((home) => {
      MATRIX_GOAL_VALUES.forEach((away) => {
        document.getElementById(`ou-cell-${home}-${away}`).disabled = true;
      });
    });
    unlockSection("odds-section");
  }

  updateStepHighlight();
  return allCorrect;
}

function fillAllCells() {
  MATRIX_GOAL_VALUES.forEach((home) => {
    MATRIX_GOAL_VALUES.forEach((away) => {
      const btn = document.getElementById(`ou-cell-${home}-${away}`);
      Object.values(CATEGORY_CLASS).forEach((c) => btn.classList.remove(c));
      btn.classList.add(CATEGORY_CLASS[classifyTotal(home + away, ouPoint)]);
    });
  });
  checkAllCells();
}

function computeOUStats(expected) {
  const categories = getCategories(ouPoint);
  const prob = {};
  const refs = {};
  categories.forEach((cat) => {
    prob[cat] = 0;
    refs[cat] = [];
  });

  MATRIX_GOAL_VALUES.forEach((home) => {
    MATRIX_GOAL_VALUES.forEach((away) => {
      const p = matrixExpected(expected, home, away);
      const category = classifyTotal(home + away, ouPoint);
      prob[category] += p;
      refs[category].push(`ou-cell:${home}-${away}`);
    });
  });

  const stats = {};
  categories.forEach((cat) => {
    stats[cat] = { prob: prob[cat], refs: refs[cat].join(",") };
  });
  return stats;
}

function betTeamProb(key) {
  return betTeamProbabilityFromStats(ouStats, ouPoint, key);
}

// While hovering a True Probability cell, fade the *other* categories'
// matrix cells into their own background so only the summed cells stay
// legible. Reads ouStats/ouPoint live, so it keeps working after a rebuild.
function attachDimComplement(key) {
  const input = document.getElementById(`tp-${key}`);
  if (!input) return;
  const cell = input.closest("td");

  function setDim(on) {
    getCategories(ouPoint)
      .filter((k) => k !== key)
      .forEach((k) => {
        if (!ouStats[k]) return;
        ouStats[k].refs.split(",").forEach((ref) => {
          const trimmed = ref.trim();
          if (!trimmed) return;
          document.querySelectorAll(`[data-cell="${trimmed}"]`).forEach((el) => {
            el.classList.toggle("dim-text", on);
          });
        });
      });
  }

  cell.addEventListener("mouseenter", () => {
    if (cell.dataset.tooltip && cell.dataset.tooltip === input.dataset.formula) setDim(true);
  });
  cell.addEventListener("mouseleave", () => setDim(false));
}

function buildTrueProbTable() {
  const categories = getCategories(ouPoint);
  const pivot = pivotForDisplay(ouPoint);
  const labels = { under: "Under", middle: getMiddleLabel(ouPoint, "Draw"), over: "Over" };

  const header = document.getElementById("true-prob-header");
  header.innerHTML = "<th></th>";
  categories.forEach((cat) => {
    header.innerHTML += `<th>${labels[cat]}</th>`;
  });

  const row = document.getElementById("true-prob-row");
  let rowHtml = `<td class="row-label">True Probability</td>`;
  categories.forEach((cat) => {
    const formula =
      cat === "under"
        ? `SUM(cells where Home+Away &lt; ${pivot})`
        : cat === "over"
        ? `SUM(cells where Home+Away &gt; ${pivot})`
        : `SUM(cells where Home+Away = ${pivot})`;
    rowHtml += `<td data-cell="tp-${cat}-cell"><input class="answer" type="number" step="0.01" id="tp-${cat}" data-formula="${formula}"></td>`;
  });
  row.innerHTML = rowHtml;
}

function buildOddsTable() {
  const body = document.getElementById("odds-table-body");
  body.innerHTML = "";
  const weight = middleWeight(ouPoint);
  const middleLabel = hasMiddleCategory(ouPoint) ? getMiddleLabel(ouPoint, "Draw") : "";
  const primaryKey = primaryBetTeamKey(ouPoint);

  BET_TEAM_KEYS.forEach((key) => {
    const label = BET_TEAM_LABELS[key];
    const prob = betTeamProb(key);
    const oddsAttrs = isUndefinedOdds(prob) ? ' disabled placeholder="N/A"' : "";

    let probFormula;
    let probRefs;
    if (weight === 0) {
      probFormula = `Same as True Probability (${label})`;
      probRefs = `tp-${key}-cell`;
    } else if (primaryKey && key !== primaryKey) {
      const otherLabel = BET_TEAM_LABELS[primaryKey];
      probFormula = `1 &minus; BetTeam Probability (${otherLabel})`;
      probRefs = `prob-${primaryKey}-cell`;
    } else if (weight === 1) {
      probFormula = `True Probability (${label}) / (1 &minus; True Probability (${middleLabel}))`;
      probRefs = `tp-${key}-cell,tp-middle-cell`;
    } else {
      probFormula = `True Probability (${label}) / (1 &minus; 0.5 &times; True Probability (${middleLabel}))`;
      probRefs = `tp-${key}-cell,tp-middle-cell`;
    }

    const row = document.createElement("tr");
    row.innerHTML = `
      <td class="row-label">${label}</td>
      <td data-cell="prob-${key}-cell"><input class="answer" type="number" step="0.01" id="prob-${key}" data-formula="${probFormula}" data-refs="${probRefs}"></td>
      <td data-cell="euro-${key}-cell"><input class="answer" type="number" step="0.01" id="euro-${key}" data-formula="1 / Probability" data-refs="prob-${key}-cell"${oddsAttrs}></td>
      <td data-cell="hk-${key}-cell"><input class="answer" type="number" step="0.01" id="hk-${key}" data-formula="Euro &minus; 1" data-refs="euro-${key}-cell"${oddsAttrs}></td>
      <td><input class="answer" type="number" step="0.01" id="malay-${key}" data-formula="HK if HK &le; 1, else &minus;1 / HK" data-refs="hk-${key}-cell"${oddsAttrs}></td>
    `;
    body.appendChild(row);
  });
}

function checkOddsTable() {
  const results = [];

  getCategories(ouPoint).forEach((cat) => {
    results.push(markInput(document.getElementById(`tp-${cat}`), ouStats[cat].prob, 0.005, 2));
  });

  BET_TEAM_KEYS.forEach((key) => {
    const prob = betTeamProb(key);
    results.push(markInput(document.getElementById(`prob-${key}`), prob, 0.005, 2));

    if (!isUndefinedOdds(prob)) {
      const euro = toEuro(prob);
      const hk = toHK(euro);
      const malay = toMalay(hk);
      results.push(markInput(document.getElementById(`euro-${key}`), euro, 0.005, 2));
      results.push(markInput(document.getElementById(`hk-${key}`), hk, 0.005, 2));
      results.push(markInput(document.getElementById(`malay-${key}`), malay, 0.005, 2));
    }
  });

  return results.every(Boolean);
}

function fillOddsTable() {
  getCategories(ouPoint).forEach((cat) => {
    document.getElementById(`tp-${cat}`).value = ouStats[cat].prob.toFixed(2);
  });

  BET_TEAM_KEYS.forEach((key) => {
    const prob = betTeamProb(key);
    document.getElementById(`prob-${key}`).value = prob.toFixed(2);

    if (!isUndefinedOdds(prob)) {
      const euro = toEuro(prob);
      const hk = toHK(euro);
      const malay = toMalay(hk);
      document.getElementById(`euro-${key}`).value = euro.toFixed(2);
      document.getElementById(`hk-${key}`).value = hk.toFixed(2);
      document.getElementById(`malay-${key}`).value = malay.toFixed(2);
    }
  });
  checkOddsTable();
}

function wireAnswerInputs(container) {
  container.querySelectorAll("input.answer").forEach((input) => {
    syncEmptyTooltip(input);
    input.addEventListener("input", () => syncEmptyTooltip(input));
    attachRefHighlight(input);
  });
}

function rebuildOddsSection(expected) {
  ouStats = computeOUStats(expected);
  buildTrueProbTable();
  buildOddsTable();

  wireAnswerInputs(document.getElementById("true-prob-table"));
  wireAnswerInputs(document.getElementById("odds-table"));
  getCategories(ouPoint).forEach((cat) => attachDimComplement(cat));
}

function resetAll() {
  document.querySelectorAll("input.answer").forEach((input) => {
    input.value = "";
    syncEmptyTooltip(input);
  });

  MATRIX_GOAL_VALUES.forEach((home) => {
    MATRIX_GOAL_VALUES.forEach((away) => {
      const btn = document.getElementById(`ou-cell-${home}-${away}`);
      Object.values(CATEGORY_CLASS).forEach((c) => btn.classList.remove(c));
      btn.closest("td").classList.remove("cell-correct", "cell-wrong");
      btn.disabled = false;
    });
  });

  ouPhaseIndex = 0;
  lockSection("ou-step-2");
  lockSection("ou-step-3");
  lockSection("odds-section");
  updateStepUI();
  updateStepHighlight();
}

function onPointChange(event) {
  ouPoint = parseFloat(event.target.value);
  rebuildOddsSection(expected);
  resetAll();
}

const expected = computeGoalStats();

buildOUMatrixTable(expected);
wireMatrixClicks();
rebuildOddsSection(expected);

lockSection("ou-step-2");
lockSection("ou-step-3");
lockSection("odds-section");
updateStepUI();
updateStepHighlight();

document.getElementById("ou-point-select").addEventListener("change", onPointChange);
document.getElementById("complete-under").addEventListener("click", completeUnder);
document.getElementById("complete-middle").addEventListener("click", completeMiddle);
document.getElementById("complete-over").addEventListener("click", checkAllCells);
document.getElementById("reset-ou").addEventListener("click", resetAll);
document.getElementById("fill-ou").addEventListener("click", fillAllCells);
document.getElementById("check-odds-table").addEventListener("click", checkOddsTable);
document.getElementById("fill-odds-table").addEventListener("click", fillOddsTable);
document.getElementById("reset-btn").addEventListener("click", resetAll);
