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
  const allCorrect = matrix.checkAll(classify1X2);
  if (allCorrect) unlockSection("odds-section");
  updateStepHighlight();
  return allCorrect;
}

function fillAllCells() {
  matrix.fillAll(classify1X2);
  checkAllCells();
}

function checkOddsTable() {
  const passed = checkSimpleOddsTable(CATEGORIES, wlStats);
  if (passed) unlockSection("part2");
  return passed;
}

function fillOddsTable() {
  fillSimpleOddsTable(CATEGORIES, wlStats);
  checkOddsTable();
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
  matrix.reset();

  wlPhaseIndex = 0;
  lockSection("wl-step-2");
  lockSection("wl-step-3");
  lockSection("odds-section");
  lockSection("part2");
  updateStepHighlight();
}

const expected = computeGoalStats();
const matrix = createMatrixClassifier({ idPrefix: "wl", expected, categoryClass: CATEGORY_CLASS });
const wlStats = matrix.computeStats(classify1X2, CATEGORIES);
const dcStats = computeDCStats(wlStats);

matrix.wireClicks(() => CATEGORY_CLASS[CATEGORIES[wlPhaseIndex]]);
buildSimpleOddsTable({
  bodyId: "odds-table-body",
  categories: CATEGORIES,
  labels: CATEGORY_LABELS,
  formulaFor: (key) =>
    key === "home" ? "SUM(cells where Home &gt; Away)" : key === "away" ? "SUM(cells where Home &lt; Away)" : "SUM(cells where Home = Away)",
});
buildDCTable();
CATEGORIES.forEach((cat) => attachDimComplement(`prob-${cat}`, cat, () => wlStats, () => CATEGORIES));

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
document.getElementById("check-odds-table").addEventListener("click", checkOddsTable);
document.getElementById("fill-odds-table").addEventListener("click", fillOddsTable);
document.getElementById("check-dc").addEventListener("click", () => checkDC(dcStats));
document.getElementById("fill-dc").addEventListener("click", () => fillDC(dcStats));
document.getElementById("reset-btn").addEventListener("click", resetAll);
