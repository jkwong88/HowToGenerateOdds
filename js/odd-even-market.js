const CATEGORIES = ["odd", "even"];
const CATEGORY_CLASS = { odd: "marked-odd", even: "marked-even" };
const CATEGORY_LABELS = { odd: "Odd", even: "Even" };
const CATEGORY_DESCRIPTIONS = { odd: "Home + Away is odd", even: "Home + Away is even" };

function isOddCell(home, away) {
  return (home + away) % 2 === 1;
}

function classifyOE(home, away) {
  return isOddCell(home, away) ? "odd" : "even";
}

// "Check" is the only place the whole grid (both odd and even selections)
// actually gets verified - painting itself is free and reversible via the
// category picker, so there's no longer a phase to advance through.
function checkAllCells() {
  const allCorrect = matrix.checkAll(classifyOE);
  if (allCorrect) unlockSection("odds-section");
  return allCorrect;
}

function fillAllCells() {
  matrix.fillAll(classifyOE);
  checkAllCells();
}

function resetAll() {
  document.querySelectorAll("input.answer").forEach((input) => {
    input.value = "";
    syncEmptyTooltip(input);
  });
  matrix.reset();
  picker.reset();
  lockSection("odds-section");
}

const expected = computeGoalStats();
const matrix = createMatrixClassifier({ idPrefix: "oe", expected, categoryClass: CATEGORY_CLASS });
const oeStats = matrix.computeStats(classifyOE, CATEGORIES);
const picker = createCategoryPicker({
  containerId: "oe-category-picker",
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
  formulaFor: (key) => `SUM(cells where Home+Away is ${key})`,
});

CATEGORIES.forEach((cat) => attachDimComplement(`prob-${cat}`, cat, () => oeStats, () => CATEGORIES));

document.querySelectorAll("input.answer").forEach((input) => {
  syncEmptyTooltip(input);
  input.addEventListener("input", () => syncEmptyTooltip(input));
  attachRefHighlight(input);
});

lockSection("odds-section");

document.getElementById("check-oe").addEventListener("click", checkAllCells);
document.getElementById("reset-oe").addEventListener("click", resetAll);
document.getElementById("fill-oe").addEventListener("click", fillAllCells);
document.getElementById("check-odds-table").addEventListener("click", () => checkSimpleOddsTable(CATEGORIES, oeStats));
document.getElementById("fill-odds-table").addEventListener("click", () => fillSimpleOddsTable(CATEGORIES, oeStats));
document.getElementById("reset-btn").addEventListener("click", resetAll);
