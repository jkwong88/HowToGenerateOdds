const CATEGORIES = ["odd", "even"];
const CATEGORY_CLASS = { odd: "marked-odd", even: "marked-even" };
const CATEGORY_LABELS = { odd: "Odd", even: "Even" };

function isOddCell(home, away) {
  return (home + away) % 2 === 1;
}

function classifyOE(home, away) {
  return isOddCell(home, away) ? "odd" : "even";
}

let oePhase = 1;

function updateStepHighlight() {
  const step2Locked = document.getElementById("oe-step-2").classList.contains("locked");
  const step3Locked = document.getElementById("oe-step-3").classList.contains("locked");

  document.getElementById("step-note-1").classList.toggle("active", step2Locked);
  document.getElementById("step-note-2").classList.toggle("active", !step2Locked && step3Locked);
}

// Step 1's "Odd" and step 2's "Even" just move to the
// next step - neither checks anything.
function completeStep1() {
  oePhase = 2;
  unlockSection("oe-step-2");
  updateStepHighlight();
}

function completeStep2() {
  unlockSection("oe-step-3");
  updateStepHighlight();
}

// Step 3's "Check" is the only place the whole grid (both odd and even
// selections) actually gets verified.
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

  oePhase = 1;
  lockSection("oe-step-2");
  lockSection("oe-step-3");
  lockSection("odds-section");
  updateStepHighlight();
}

const expected = computeGoalStats();
const matrix = createMatrixClassifier({ idPrefix: "oe", expected, categoryClass: CATEGORY_CLASS });
const oeStats = matrix.computeStats(classifyOE, CATEGORIES);

matrix.wireClicks(() => CATEGORY_CLASS[oePhase === 1 ? "odd" : "even"]);
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

lockSection("oe-step-2");
lockSection("oe-step-3");
lockSection("odds-section");
updateStepHighlight();

document.getElementById("check-odd").addEventListener("click", completeStep1);
document.getElementById("check-even").addEventListener("click", completeStep2);
document.getElementById("check-oe").addEventListener("click", checkAllCells);
document.getElementById("reset-oe").addEventListener("click", resetAll);
document.getElementById("fill-oe").addEventListener("click", fillAllCells);
document.getElementById("check-odds-table").addEventListener("click", () => checkSimpleOddsTable(CATEGORIES, oeStats));
document.getElementById("fill-odds-table").addEventListener("click", () => fillSimpleOddsTable(CATEGORIES, oeStats));
document.getElementById("reset-btn").addEventListener("click", resetAll);
