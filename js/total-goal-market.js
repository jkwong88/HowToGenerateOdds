const CATEGORY_CLASS = { b01: "marked-under", b23: "marked-middle", b46: "marked-over", b7p: "marked-odd" };
const CATEGORIES = ["b01", "b23", "b46", "b7p"];
const CATEGORY_LABELS = { b01: "0~1", b23: "2~3", b46: "4~6", b7p: "7 & Over" };
const STEP_IDS = { b01: "tg-step-1", b23: "tg-step-2", b46: "tg-step-3", b7p: "tg-step-4" };

let tgPhaseIndex = 0;

function classifyTotalGoal(home, away) {
  const total = home + away;
  if (total <= 1) return "b01";
  if (total <= 3) return "b23";
  if (total <= 6) return "b46";
  return "b7p";
}

function buildTGMatrixTable(expected) {
  const header = document.getElementById("tg-matrix-header");
  MATRIX_GOAL_VALUES.forEach((v) => {
    header.innerHTML += `<th>${v}</th>`;
  });

  const body = document.getElementById("tg-matrix-body");
  MATRIX_GOAL_VALUES.forEach((home) => {
    const row = document.createElement("tr");
    let cells = `<td class="row-label">${home}</td>`;
    MATRIX_GOAL_VALUES.forEach((away) => {
      const value = matrixExpected(expected, home, away).toFixed(2);
      cells += `<td><button type="button" class="oe-cell" id="tg-cell-${home}-${away}" data-cell="tg-cell:${home}-${away}">${value}</button></td>`;
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
      const btn = document.getElementById(`tg-cell-${home}-${away}`);
      btn.addEventListener("click", () => {
        if (btn.disabled) return;
        btn.closest("td").classList.remove("cell-correct", "cell-wrong");
        const targetClass = CATEGORY_CLASS[CATEGORIES[tgPhaseIndex]];
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

function updateStepHighlight() {
  const locked = {};
  CATEGORIES.forEach((cat) => {
    locked[cat] = document.getElementById(STEP_IDS[cat]).classList.contains("locked");
  });
  const oddsLocked = document.getElementById("odds-section").classList.contains("locked");

  document.getElementById("step-note-1").classList.toggle("active", locked.b23);
  document.getElementById("step-note-2").classList.toggle("active", !locked.b23 && locked.b46);
  document.getElementById("step-note-3").classList.toggle("active", !locked.b46 && locked.b7p);
  document.getElementById("step-note-4").classList.toggle("active", !locked.b7p && oddsLocked);
}

// The first three steps just move to the next step - none of them check
// anything. The last step ("7 & Over") is the only place the whole grid
// actually gets verified.
function completeB01() {
  tgPhaseIndex = 1;
  unlockSection("tg-step-2");
  updateStepHighlight();
}

function completeB23() {
  tgPhaseIndex = 2;
  unlockSection("tg-step-3");
  updateStepHighlight();
}

function completeB46() {
  tgPhaseIndex = 3;
  unlockSection("tg-step-4");
  updateStepHighlight();
}

function checkAllCells() {
  let allCorrect = true;

  MATRIX_GOAL_VALUES.forEach((home) => {
    MATRIX_GOAL_VALUES.forEach((away) => {
      const btn = document.getElementById(`tg-cell-${home}-${away}`);
      const cell = btn.closest("td");
      const correctClass = CATEGORY_CLASS[classifyTotalGoal(home, away)];
      const isCorrect = btn.classList.contains(correctClass);
      cell.classList.toggle("cell-correct", isCorrect);
      cell.classList.toggle("cell-wrong", !isCorrect);
      if (!isCorrect) allCorrect = false;
    });
  });

  if (allCorrect) {
    MATRIX_GOAL_VALUES.forEach((home) => {
      MATRIX_GOAL_VALUES.forEach((away) => {
        document.getElementById(`tg-cell-${home}-${away}`).disabled = true;
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
      const btn = document.getElementById(`tg-cell-${home}-${away}`);
      Object.values(CATEGORY_CLASS).forEach((c) => btn.classList.remove(c));
      btn.classList.add(CATEGORY_CLASS[classifyTotalGoal(home, away)]);
    });
  });
  checkAllCells();
}

function computeTGStats(expected) {
  const prob = { b01: 0, b23: 0, b46: 0, b7p: 0 };
  const refs = { b01: [], b23: [], b46: [], b7p: [] };

  MATRIX_GOAL_VALUES.forEach((home) => {
    MATRIX_GOAL_VALUES.forEach((away) => {
      const p = matrixExpected(expected, home, away);
      const cat = classifyTotalGoal(home, away);
      prob[cat] += p;
      refs[cat].push(`tg-cell:${home}-${away}`);
    });
  });

  const stats = {};
  CATEGORIES.forEach((cat) => {
    stats[cat] = { prob: prob[cat], refs: refs[cat].join(",") };
  });
  return stats;
}

// While hovering a True Probability formula, fade the *other* categories'
// matrix cells into their own background so only the summed cells stay legible.
function attachDimComplement(key, tgStats) {
  const input = document.getElementById(`prob-${key}`);
  const cell = input.closest("td");

  function setDim(on) {
    CATEGORIES.filter((k) => k !== key).forEach((k) => {
      tgStats[k].refs.split(",").forEach((ref) => {
        const trimmed = ref.trim();
        if (!trimmed) return;
        document.querySelectorAll(`[data-cell="${trimmed}"]`).forEach((el) => el.classList.toggle("dim-text", on));
      });
    });
  }

  cell.addEventListener("mouseenter", () => {
    if (cell.dataset.tooltip && cell.dataset.tooltip === input.dataset.formula) setDim(true);
  });
  cell.addEventListener("mouseleave", () => setDim(false));
}

function buildOddsTable() {
  const body = document.getElementById("odds-table-body");
  const formulas = {
    b01: "SUM(cells where Home+Away &le; 1)",
    b23: "SUM(cells where 2 &le; Home+Away &le; 3)",
    b46: "SUM(cells where 4 &le; Home+Away &le; 6)",
    b7p: "SUM(cells where Home+Away &ge; 7)",
  };

  CATEGORIES.forEach((key) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td class="row-label">${CATEGORY_LABELS[key]}</td>
      <td data-cell="prob-${key}-cell"><input class="answer" type="number" step="0.01" id="prob-${key}" data-formula="${formulas[key]}"></td>
      <td data-cell="euro-${key}-cell"><input class="answer" type="number" step="0.01" id="euro-${key}" data-formula="1 / Probability" data-refs="prob-${key}-cell"></td>
      <td data-cell="hk-${key}-cell"><input class="answer" type="number" step="0.01" id="hk-${key}" data-formula="Euro &minus; 1" data-refs="euro-${key}-cell"></td>
      <td><input class="answer" type="number" step="0.01" id="malay-${key}" data-formula="HK if HK &le; 1, else &minus;1 / HK" data-refs="hk-${key}-cell"></td>
    `;
    body.appendChild(row);
  });
}

function checkOddsTable(tgStats) {
  const results = [];

  CATEGORIES.forEach((key) => {
    const prob = tgStats[key].prob;
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

function fillOddsTable(tgStats) {
  CATEGORIES.forEach((key) => {
    const prob = tgStats[key].prob;
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
  checkOddsTable(tgStats);
}

function resetAll() {
  document.querySelectorAll("input.answer").forEach((input) => {
    input.value = "";
    syncEmptyTooltip(input);
  });

  MATRIX_GOAL_VALUES.forEach((home) => {
    MATRIX_GOAL_VALUES.forEach((away) => {
      const btn = document.getElementById(`tg-cell-${home}-${away}`);
      Object.values(CATEGORY_CLASS).forEach((c) => btn.classList.remove(c));
      btn.closest("td").classList.remove("cell-correct", "cell-wrong");
      btn.disabled = false;
    });
  });

  tgPhaseIndex = 0;
  lockSection("tg-step-2");
  lockSection("tg-step-3");
  lockSection("tg-step-4");
  lockSection("odds-section");
  updateStepHighlight();
}

const expected = computeGoalStats();
const tgStats = computeTGStats(expected);

buildTGMatrixTable(expected);
wireMatrixClicks();
buildOddsTable();
CATEGORIES.forEach((cat) => attachDimComplement(cat, tgStats));

document.querySelectorAll("input.answer").forEach((input) => {
  syncEmptyTooltip(input);
  input.addEventListener("input", () => syncEmptyTooltip(input));
  attachRefHighlight(input);
});

lockSection("tg-step-2");
lockSection("tg-step-3");
lockSection("tg-step-4");
lockSection("odds-section");
updateStepHighlight();

document.getElementById("complete-b01").addEventListener("click", completeB01);
document.getElementById("complete-b23").addEventListener("click", completeB23);
document.getElementById("complete-b46").addEventListener("click", completeB46);
document.getElementById("complete-b7p").addEventListener("click", checkAllCells);
document.getElementById("reset-tg").addEventListener("click", resetAll);
document.getElementById("fill-tg").addEventListener("click", fillAllCells);
document.getElementById("check-odds-table").addEventListener("click", () => checkOddsTable(tgStats));
document.getElementById("fill-odds-table").addEventListener("click", () => fillOddsTable(tgStats));
document.getElementById("reset-btn").addEventListener("click", resetAll);
