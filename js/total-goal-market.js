const CATEGORY_CLASS = { b01: "marked-under", b23: "marked-middle", b46: "marked-over", b7p: "marked-odd" };
const CATEGORIES = ["b01", "b23", "b46", "b7p"];
const CATEGORY_LABELS = { b01: "0–1", b23: "2–3", b46: "4–6", b7p: "7+" };
const CATEGORY_DESCRIPTIONS = {
  b01: "Home + Away &le; 1",
  b23: "2 &le; Home + Away &le; 3",
  b46: "4 &le; Home + Away &le; 6",
  b7p: "Home + Away &ge; 7",
};

function classifyTotalGoal(home, away) {
  const total = home + away;
  if (total <= 1) return "b01";
  if (total <= 3) return "b23";
  if (total <= 6) return "b46";
  return "b7p";
}

// "Check Classification" is the only place the whole grid actually gets
// verified - painting itself is free and reversible via the category
// picker, so there's no longer a phase to advance through.
function checkAllCells() {
  const allCorrect = matrix.checkAll(classifyTotalGoal);
  if (allCorrect) unlockSection("odds-section");
  return allCorrect;
}

function fillAllCells() {
  matrix.fillAll(classifyTotalGoal);
  checkAllCells();
}

function resetAll() {
  document.querySelectorAll("input.answer").forEach((input) => {
    input.value = "";
    syncEmptyTooltip(input);
  });
  resetSimpleOddsTable(CATEGORIES, "given");
  matrix.reset();
  picker.reset();
  lockSection("odds-section");
}

const expected = computeGoalStats();
const matrix = createMatrixClassifier({ idPrefix: "tg", expected, categoryClass: CATEGORY_CLASS });
const tgStats = matrix.computeStats(classifyTotalGoal, CATEGORIES);
const picker = createCategoryPicker({
  containerId: "tg-category-picker",
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
    ({
      b01: "SUM(cells where Home+Away &le; 1)",
      b23: "SUM(cells where 2 &le; Home+Away &le; 3)",
      b46: "SUM(cells where 4 &le; Home+Away &le; 6)",
      b7p: "SUM(cells where Home+Away &ge; 7)",
    }[key]),
  euroMode: "given",
});
CATEGORIES.forEach((cat) => attachDimComplement(`prob-${cat}`, cat, () => tgStats, () => CATEGORIES));

document.querySelectorAll("input.answer").forEach((input) => {
  syncEmptyTooltip(input);
  input.addEventListener("input", () => syncEmptyTooltip(input));
  attachRefHighlight(input);
});

lockSection("odds-section");

document.getElementById("check-tg").addEventListener("click", checkAllCells);
document.getElementById("reset-tg").addEventListener("click", resetAll);
document.getElementById("fill-tg").addEventListener("click", fillAllCells);
document.getElementById("check-odds-table").addEventListener("click", () => checkSimpleOddsTable(CATEGORIES, tgStats, "given"));
document.getElementById("fill-odds-table").addEventListener("click", () => fillSimpleOddsTable(CATEGORIES, tgStats, "given"));
document.getElementById("reset-btn").addEventListener("click", resetAll);
