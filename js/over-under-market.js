const CATEGORY_CLASS = { under: "marked-under", middle: "marked-middle", over: "marked-over" };
const BET_TEAM_KEYS = ["under", "over"];
const BET_TEAM_LABELS = { under: "Under", over: "Over" };

let ouPoint = 2.5;
let ouPhaseIndex = 0;
let ouStats = null;

function classifyOU(home, away) {
  return classifyTotal(home + away, ouPoint);
}

function updateStepUI() {
  const hasMiddle = hasMiddleCategory(ouPoint);
  const actionLabel = hasMiddle ? getMiddleActionLabel(ouPoint, "Push") : "";
  const pivot = pivotForDisplay(ouPoint);

  document.getElementById("ou-step-2").style.display = hasMiddle ? "" : "none";
  document.getElementById("complete-middle").textContent = actionLabel;

  const note1 = document.getElementById("step-note-1");
  const note2 = document.getElementById("step-note-2");
  const note3 = document.getElementById("step-note-3");

  note1.innerHTML = `Step 1: click every cell where Home + Away is <strong>under ${pivot}</strong>, then click Under.`;

  if (hasMiddle) {
    note2.style.display = "";
    if (getPointType(ouPoint) === "integer") {
      note2.innerHTML = `Step 2: click every cell where Home + Away <strong>equals ${pivot}</strong> (${actionLabel}), then click ${actionLabel}.`;
    } else {
      const { overWord, underWord } = getSplitSettlementWords(ouPoint);
      note2.innerHTML = `Step 2: click every cell where Home + Away <strong>equals ${pivot}</strong> - at ${ouPoint}, this is a split settlement (Over = ${overWord}, Under = ${underWord}), then click ${actionLabel}.`;
    }
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
  const allCorrect = matrix.checkAll(classifyOU);
  if (allCorrect) unlockSection("odds-section");
  updateStepHighlight();
  return allCorrect;
}

// Show Answers skips the manual Step 1/2/3 clicks that would otherwise
// unlock these sections, so it has to unlock them itself - otherwise the
// grid ends up fully filled and checked while the step buttons stay locked
// and the instructions still point at Step 1.
function fillAllCells() {
  matrix.fillAll(classifyOU);
  ouPhaseIndex = getCategories(ouPoint).length - 1;
  unlockSection("ou-step-2");
  unlockSection("ou-step-3");
  checkAllCells();
}

function betTeamProb(key) {
  return betTeamProbabilityFromStats(ouStats, ouPoint, key);
}

function buildTrueProbTable() {
  const categories = getCategories(ouPoint);
  const pivot = pivotForDisplay(ouPoint);
  const labels = { under: "Under", middle: getMiddleLabel(ouPoint, "Push", BET_TEAM_LABELS), over: "Over" };

  const header = document.getElementById("true-prob-header");
  header.innerHTML = "<th></th>";
  categories.forEach((cat) => {
    header.innerHTML += `<th>${labels[cat]}</th>`;
  });

  const row = document.getElementById("true-prob-row");
  let rowHtml = `<td class="row-label">Fair Probability</td>`;
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
  const middleLabel = hasMiddleCategory(ouPoint) ? getMiddleLabel(ouPoint, "Push", BET_TEAM_LABELS) : "";
  const primaryKey = primaryBetTeamKey(ouPoint);

  BET_TEAM_KEYS.forEach((key) => {
    const label = BET_TEAM_LABELS[key];
    const prob = betTeamProb(key);
    const oddsAttrs = isUndefinedOdds(prob) ? ' disabled placeholder="N/A"' : "";

    let probFormula;
    let probRefs;
    if (weight === 0) {
      probFormula = `Same as Fair Probability (${label})`;
      probRefs = `tp-${key}-cell`;
    } else if (primaryKey && key !== primaryKey) {
      const otherLabel = BET_TEAM_LABELS[primaryKey];
      probFormula = `1 &minus; Selection Probability (${otherLabel})`;
      probRefs = `prob-${primaryKey}-cell`;
    } else if (weight === 1) {
      probFormula = `Fair Probability (${label}) / (1 &minus; Fair Probability (${middleLabel}))`;
      probRefs = `tp-${key}-cell,tp-middle-cell`;
    } else {
      probFormula = `Fair Probability (${label}) / (1 &minus; 0.5 &times; Fair Probability (${middleLabel}))`;
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
  ouStats = matrix.computeStats(classifyOU, getCategories(ouPoint));
  buildTrueProbTable();
  buildOddsTable();

  wireAnswerInputs(document.getElementById("true-prob-table"));
  wireAnswerInputs(document.getElementById("odds-table"));
  getCategories(ouPoint).forEach((cat) => attachDimComplement(`tp-${cat}`, cat, () => ouStats, () => getCategories(ouPoint)));
}

function resetAll() {
  document.querySelectorAll("input.answer").forEach((input) => {
    input.value = "";
    syncEmptyTooltip(input);
  });
  matrix.reset();

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
const matrix = createMatrixClassifier({ idPrefix: "ou", expected, categoryClass: CATEGORY_CLASS });

matrix.wireClicks(() => CATEGORY_CLASS[getCategories(ouPoint)[ouPhaseIndex]]);
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
