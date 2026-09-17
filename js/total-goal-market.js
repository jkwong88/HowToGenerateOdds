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
  const allCorrect = matrix.checkAll(classifyTotalGoal);
  if (allCorrect) unlockSection("odds-section");
  updateStepHighlight();
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
  matrix.reset();

  tgPhaseIndex = 0;
  lockSection("tg-step-2");
  lockSection("tg-step-3");
  lockSection("tg-step-4");
  lockSection("odds-section");
  updateStepHighlight();
}

const expected = computeGoalStats();
const matrix = createMatrixClassifier({ idPrefix: "tg", expected, categoryClass: CATEGORY_CLASS });
const tgStats = matrix.computeStats(classifyTotalGoal, CATEGORIES);

matrix.wireClicks(() => CATEGORY_CLASS[CATEGORIES[tgPhaseIndex]]);
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
  includeHkMalay: false,
});
CATEGORIES.forEach((cat) => attachDimComplement(`prob-${cat}`, cat, () => tgStats, () => CATEGORIES));

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
document.getElementById("check-odds-table").addEventListener("click", () => checkSimpleOddsTable(CATEGORIES, tgStats, false));
document.getElementById("fill-odds-table").addEventListener("click", () => fillSimpleOddsTable(CATEGORIES, tgStats, false));
document.getElementById("reset-btn").addEventListener("click", resetAll);
