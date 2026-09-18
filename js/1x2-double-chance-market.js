const CATEGORY_CLASS = { home: "marked-under", draw: "marked-middle", away: "marked-over" };
const CATEGORIES = ["home", "draw", "away"];
const CATEGORY_LABELS = { home: "Home", draw: "Draw", away: "Away" };

const DC_KEYS = ["1X", "12", "X2"];
const DC_COMBOS = { "1X": ["home", "draw"], "12": ["home", "away"], X2: ["draw", "away"] };

function classify1X2(home, away) {
  if (home > away) return "home";
  if (home < away) return "away";
  return "draw";
}

// "Check Classification" is the only place the whole grid actually gets
// verified - painting itself is free and reversible via the category
// picker, so there's no longer a phase to advance through.
function checkAllCells() {
  const allCorrect = matrix.checkAll(classify1X2);
  if (allCorrect) unlockSection("odds-section");
  return allCorrect;
}

function fillAllCells() {
  matrix.fillAll(classify1X2);
  checkAllCells();
}

function checkOddsTable() {
  const passed = checkSimpleOddsTable(CATEGORIES, wlStats, "given");
  if (passed) unlockSection("part2");
  return passed;
}

function fillOddsTable() {
  fillSimpleOddsTable(CATEGORIES, wlStats, "given");
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
    `;
    body.appendChild(row);
  });
}

// Only Probability is graded - Euro Odds is a pure derived display cell
// that populates once Probability checks out, so it never needs to
// participate in lockSection/unlockSection's input.answer toggling.
function checkDC(dcStats) {
  const results = DC_KEYS.map((key) => markInput(document.getElementById(`dc-prob-${key}`), dcStats[key], 0.005, 2));
  const passed = results.every(Boolean);

  if (passed) {
    DC_KEYS.forEach((key) => {
      const euro = toEuro(dcStats[key]);
      document.getElementById(`dc-euro-${key}`).textContent = euro.toFixed(2);
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
  });
}

function resetAll() {
  document.querySelectorAll("input.answer").forEach((input) => {
    input.value = "";
    syncEmptyTooltip(input);
  });
  resetSimpleOddsTable(CATEGORIES, "given");
  resetDCDisplay();
  matrix.reset();
  picker.reset();

  lockSection("odds-section");
  lockSection("part2");
}

const expected = computeGoalStats();
const matrix = createMatrixClassifier({ idPrefix: "wl", expected, categoryClass: CATEGORY_CLASS });
const wlStats = matrix.computeStats(classify1X2, CATEGORIES);
const dcStats = computeDCStats(wlStats);
const CATEGORY_DESCRIPTIONS = { home: "Home &gt; Away", draw: "Home = Away", away: "Home &lt; Away" };
const picker = createCategoryPicker({
  containerId: "wl-category-picker",
  categories: CATEGORIES,
  categoryClass: CATEGORY_CLASS,
  labels: CATEGORY_LABELS,
  descriptions: CATEGORY_DESCRIPTIONS,
});

matrix.wireClicks(() => CATEGORY_CLASS[picker.getActive()]);
buildSimpleOddsTable({
  bodyId: "odds-table-body",
  categories: CATEGORIES,
  labels: CATEGORY_LABELS,
  formulaFor: (key) =>
    key === "home" ? "SUM(cells where Home &gt; Away)" : key === "away" ? "SUM(cells where Home &lt; Away)" : "SUM(cells where Home = Away)",
  euroMode: "given",
});
buildDCTable();
CATEGORIES.forEach((cat) => attachDimComplement(`prob-${cat}`, cat, () => wlStats, () => CATEGORIES));

document.querySelectorAll("input.answer").forEach((input) => {
  syncEmptyTooltip(input);
  input.addEventListener("input", () => syncEmptyTooltip(input));
  attachRefHighlight(input);
});

lockSection("odds-section");
lockSection("part2");

document.getElementById("check-wl").addEventListener("click", checkAllCells);
document.getElementById("reset-wl").addEventListener("click", resetAll);
document.getElementById("fill-wl").addEventListener("click", fillAllCells);
document.getElementById("check-odds-table").addEventListener("click", checkOddsTable);
document.getElementById("fill-odds-table").addEventListener("click", fillOddsTable);
document.getElementById("check-dc").addEventListener("click", () => checkDC(dcStats));
document.getElementById("fill-dc").addEventListener("click", () => fillDC(dcStats));
document.getElementById("reset-btn").addEventListener("click", resetAll);
