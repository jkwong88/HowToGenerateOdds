const CATEGORY_CLASS = { home: "marked-under", draw: "marked-middle", away: "marked-over" };
const CATEGORIES = ["home", "draw", "away"];
const CATEGORY_LABELS = { home: "Home", draw: "Draw", away: "Away" };

const DC_KEYS = ["1X", "12", "X2"];
const DC_COMBOS = { "1X": ["home", "draw"], "12": ["home", "away"], X2: ["draw", "away"] };

let wlPhaseIndex = 0;

function classify1X2(home, away) {
  if (home > away) return "home";
  if (home < away) return "away";
  return "draw";
}

function buildWLMatrixTable(expected) {
  const header = document.getElementById("wl-matrix-header");
  MATRIX_GOAL_VALUES.forEach((v) => {
    header.innerHTML += `<th>${v}</th>`;
  });

  const body = document.getElementById("wl-matrix-body");
  MATRIX_GOAL_VALUES.forEach((home) => {
    const row = document.createElement("tr");
    let cells = `<td class="row-label">${home}</td>`;
    MATRIX_GOAL_VALUES.forEach((away) => {
      const value = matrixExpected(expected, home, away).toFixed(2);
      cells += `<td><button type="button" class="oe-cell" id="wl-cell-${home}-${away}" data-cell="wl-cell:${home}-${away}">${value}</button></td>`;
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
      const btn = document.getElementById(`wl-cell-${home}-${away}`);
      btn.addEventListener("click", () => {
        if (btn.disabled) return;
        btn.closest("td").classList.remove("cell-correct", "cell-wrong");
        const targetClass = CATEGORY_CLASS[CATEGORIES[wlPhaseIndex]];
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
  const step2Locked = document.getElementById("wl-step-2").classList.contains("locked");
  const step3Locked = document.getElementById("wl-step-3").classList.contains("locked");
  const oddsLocked = document.getElementById("odds-section").classList.contains("locked");

  document.getElementById("step-note-1").classList.toggle("active", step2Locked);
  document.getElementById("step-note-2").classList.toggle("active", !step2Locked && step3Locked);
  document.getElementById("step-note-3").classList.toggle("active", !step3Locked && oddsLocked);
}

// "Home" and "Draw" just move to the next step - neither checks anything.
function completeHome() {
  wlPhaseIndex = 1;
  unlockSection("wl-step-2");
  updateStepHighlight();
}

function completeDraw() {
  wlPhaseIndex = 2;
  unlockSection("wl-step-3");
  updateStepHighlight();
}

// "Away" is the only place the whole grid actually gets verified.
function checkAllCells() {
  let allCorrect = true;

  MATRIX_GOAL_VALUES.forEach((home) => {
    MATRIX_GOAL_VALUES.forEach((away) => {
      const btn = document.getElementById(`wl-cell-${home}-${away}`);
      const cell = btn.closest("td");
      const correctClass = CATEGORY_CLASS[classify1X2(home, away)];
      const isCorrect = btn.classList.contains(correctClass);
      cell.classList.toggle("cell-correct", isCorrect);
      cell.classList.toggle("cell-wrong", !isCorrect);
      if (!isCorrect) allCorrect = false;
    });
  });

  if (allCorrect) {
    MATRIX_GOAL_VALUES.forEach((home) => {
      MATRIX_GOAL_VALUES.forEach((away) => {
        document.getElementById(`wl-cell-${home}-${away}`).disabled = true;
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
      const btn = document.getElementById(`wl-cell-${home}-${away}`);
      Object.values(CATEGORY_CLASS).forEach((c) => btn.classList.remove(c));
      btn.classList.add(CATEGORY_CLASS[classify1X2(home, away)]);
    });
  });
  checkAllCells();
}

function compute1X2Stats(expected) {
  const prob = { home: 0, draw: 0, away: 0 };
  const refs = { home: [], draw: [], away: [] };

  MATRIX_GOAL_VALUES.forEach((home) => {
    MATRIX_GOAL_VALUES.forEach((away) => {
      const p = matrixExpected(expected, home, away);
      const cat = classify1X2(home, away);
      prob[cat] += p;
      refs[cat].push(`wl-cell:${home}-${away}`);
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
function attachDimComplement(key, wlStats) {
  const input = document.getElementById(`prob-${key}`);
  const cell = input.closest("td");

  function setDim(on) {
    CATEGORIES.filter((k) => k !== key).forEach((k) => {
      wlStats[k].refs.split(",").forEach((ref) => {
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
    home: "SUM(cells where Home &gt; Away)",
    draw: "SUM(cells where Home = Away)",
    away: "SUM(cells where Home &lt; Away)",
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

function checkOddsTable(wlStats) {
  const results = [];

  CATEGORIES.forEach((key) => {
    const prob = wlStats[key].prob;
    const euro = toEuro(prob);
    const hk = toHK(euro);
    const malay = toMalay(hk);
    results.push(markInput(document.getElementById(`prob-${key}`), prob, 0.005, 2));
    results.push(markInput(document.getElementById(`euro-${key}`), euro, 0.005, 2));
    results.push(markInput(document.getElementById(`hk-${key}`), hk, 0.005, 2));
    results.push(markInput(document.getElementById(`malay-${key}`), malay, 0.005, 2));
  });

  const passed = results.every(Boolean);
  if (passed) unlockSection("part2");
  return passed;
}

function fillOddsTable(wlStats) {
  CATEGORIES.forEach((key) => {
    const prob = wlStats[key].prob;
    const euro = toEuro(prob);
    const hk = toHK(euro);
    const malay = toMalay(hk);
    document.getElementById(`prob-${key}`).value = prob.toFixed(2);
    document.getElementById(`euro-${key}`).value = euro.toFixed(2);
    document.getElementById(`hk-${key}`).value = hk.toFixed(2);
    document.getElementById(`malay-${key}`).value = malay.toFixed(2);
  });
  checkOddsTable(wlStats);
}

function computeDCStats(wlStats) {
  const stats = {};
  DC_KEYS.forEach((key) => {
    const [a, b] = DC_COMBOS[key];
    stats[key] = wlStats[a].prob + wlStats[b].prob;
  });
  return stats;
}

function buildDCTable() {
  const body = document.getElementById("dc-table-body");
  DC_KEYS.forEach((key) => {
    const [a, b] = DC_COMBOS[key];
    const formula = `P(${CATEGORY_LABELS[a]}) + P(${CATEGORY_LABELS[b]})`;
    const row = document.createElement("tr");
    row.innerHTML = `
      <td class="row-label">${key}</td>
      <td data-cell="dc-prob-${key}-cell"><input class="answer" type="number" step="0.01" id="dc-prob-${key}" data-formula="${formula}" data-refs="prob-${a}-cell,prob-${b}-cell"></td>
      <td class="given-value" id="dc-euro-${key}">&mdash;</td>
      <td class="given-value" id="dc-hk-${key}">&mdash;</td>
      <td class="given-value" id="dc-malay-${key}">&mdash;</td>
    `;
    body.appendChild(row);
  });
}

// Only Probability is graded - Euro/HK/Malay are pure derived display cells
// that populate once Probability checks out, so they never need to
// participate in lockSection/unlockSection's input.answer toggling.
function checkDC(dcStats) {
  const results = DC_KEYS.map((key) => markInput(document.getElementById(`dc-prob-${key}`), dcStats[key], 0.005, 2));
  const passed = results.every(Boolean);

  if (passed) {
    DC_KEYS.forEach((key) => {
      const prob = dcStats[key];
      const euro = toEuro(prob);
      const hk = toHK(euro);
      const malay = toMalay(hk);
      document.getElementById(`dc-euro-${key}`).textContent = euro.toFixed(2);
      document.getElementById(`dc-hk-${key}`).textContent = hk.toFixed(2);
      document.getElementById(`dc-malay-${key}`).textContent = malay.toFixed(2);
    });
  }

  return passed;
}

function fillDC(dcStats) {
  DC_KEYS.forEach((key) => {
    document.getElementById(`dc-prob-${key}`).value = dcStats[key].toFixed(2);
  });
  checkDC(dcStats);
}

function resetDCDisplay() {
  DC_KEYS.forEach((key) => {
    document.getElementById(`dc-euro-${key}`).textContent = "—";
    document.getElementById(`dc-hk-${key}`).textContent = "—";
    document.getElementById(`dc-malay-${key}`).textContent = "—";
  });
}

function resetAll() {
  document.querySelectorAll("input.answer").forEach((input) => {
    input.value = "";
    syncEmptyTooltip(input);
  });
  resetDCDisplay();

  MATRIX_GOAL_VALUES.forEach((home) => {
    MATRIX_GOAL_VALUES.forEach((away) => {
      const btn = document.getElementById(`wl-cell-${home}-${away}`);
      Object.values(CATEGORY_CLASS).forEach((c) => btn.classList.remove(c));
      btn.closest("td").classList.remove("cell-correct", "cell-wrong");
      btn.disabled = false;
    });
  });

  wlPhaseIndex = 0;
  lockSection("wl-step-2");
  lockSection("wl-step-3");
  lockSection("odds-section");
  lockSection("part2");
  updateStepHighlight();
}

const expected = computeGoalStats();
const wlStats = compute1X2Stats(expected);
const dcStats = computeDCStats(wlStats);

buildWLMatrixTable(expected);
wireMatrixClicks();
buildOddsTable();
buildDCTable();
CATEGORIES.forEach((cat) => attachDimComplement(cat, wlStats));

document.querySelectorAll("input.answer").forEach((input) => {
  syncEmptyTooltip(input);
  input.addEventListener("input", () => syncEmptyTooltip(input));
  attachRefHighlight(input);
});

lockSection("wl-step-2");
lockSection("wl-step-3");
lockSection("odds-section");
lockSection("part2");
updateStepHighlight();

document.getElementById("complete-home").addEventListener("click", completeHome);
document.getElementById("complete-draw").addEventListener("click", completeDraw);
document.getElementById("complete-away").addEventListener("click", checkAllCells);
document.getElementById("reset-wl").addEventListener("click", resetAll);
document.getElementById("fill-wl").addEventListener("click", fillAllCells);
document.getElementById("check-odds-table").addEventListener("click", () => checkOddsTable(wlStats));
document.getElementById("fill-odds-table").addEventListener("click", () => fillOddsTable(wlStats));
document.getElementById("check-dc").addEventListener("click", () => checkDC(dcStats));
document.getElementById("fill-dc").addEventListener("click", () => fillDC(dcStats));
document.getElementById("reset-btn").addEventListener("click", resetAll);
