const CATEGORY_CLASS = { under: "marked-under", middle: "marked-middle", over: "marked-over" };
const BET_TEAM_KEYS = ["under", "over"];
const BET_TEAM_LABELS = { under: "Away Covers", over: "Home Covers" };

// The odds conversion chain (Euro/HK/Malay) is only graded at this line -
// it's already drilled in 3.1-3.4, so re-testing it on every Line change
// here would just be repetitive. Every other line still grades the
// Settlement-Adjusted Fair Probability itself (that's this exercise's
// actual focus), but shows Euro/HK/Malay as given, derived values instead.
const DEFAULT_LINE = 1;

let hdpLine = DEFAULT_LINE;
let hdpStats = null;

// data.js's hdpLineToPoint negates the standard Asian Handicap sign into the
// point classifyTotal/etc. compare Home - Away against - see its comment for
// the full derivation.
const pointForClassify = hdpLineToPoint;

function classifyHDP(home, away) {
  return classifyTotal(home - away, pointForClassify(hdpLine));
}

// Single, non-sequential guide: the basic Away Covers/Push/Home Covers
// condition per category is shown on the picker cards themselves (see
// categoryDescriptions), so this only needs to call out the one thing a
// card can't - the split settlement's asymmetric half-win/half-loss
// nuance at a quarter line - and can stay short everywhere else, instead
// of being walked through a fixed Step 1 -> Step 2 -> ... click sequence
// that couldn't be corrected once advanced past.
function updateGuideText() {
  const point = pointForClassify(hdpLine);
  const guide = document.getElementById("hdp-guide");
  let text = "Select a category, then click matrix cells to classify them.";

  if (hasMiddleCategory(point) && getPointType(point) !== "integer") {
    const pivot = pivotForDisplay(point);
    const { overWord, underWord } = getSplitSettlementWords(point);
    text += ` At this line, the pivot scoreline (Home &minus; Away = ${pivot}) is a split settlement - Home Covers: ${overWord}, Away Covers: ${underWord}.`;
  }
  guide.innerHTML = text;
}

function categoryLabels() {
  return { under: "Away Covers", middle: getMiddleActionLabel(pointForClassify(hdpLine), "Push"), over: "Home Covers" };
}

function categoryDescriptions() {
  const point = pointForClassify(hdpLine);
  const pivot = pivotForDisplay(point);
  const desc = { under: `Home &minus; Away &lt; ${pivot}`, over: `Home &minus; Away &gt; ${pivot}` };
  if (hasMiddleCategory(point)) desc.middle = `Home &minus; Away = ${pivot}`;
  return desc;
}

// "Check Classification" is the only place the whole grid actually gets
// verified - painting itself is free and reversible via the category
// picker, so there's no longer a phase to advance through.
function checkAllCells() {
  const allCorrect = matrix.checkAll(classifyHDP);
  if (allCorrect) unlockSection("odds-section");
  return allCorrect;
}

function fillAllCells() {
  matrix.fillAll(classifyHDP);
  checkAllCells();
}

function betTeamProb(key) {
  return betTeamProbabilityFromStats(hdpStats, pointForClassify(hdpLine), key);
}

function buildTrueProbTable() {
  const point = pointForClassify(hdpLine);
  const categories = getCategories(point);
  const pivot = pivotForDisplay(point);
  const labels = { under: "Away Covers", middle: getMiddleLabel(point, "Push", BET_TEAM_LABELS), over: "Home Covers" };

  const header = document.getElementById("true-prob-header");
  header.innerHTML = "<th></th>";
  categories.forEach((cat) => {
    header.innerHTML += `<th>${labels[cat]}</th>`;
  });

  const row = document.getElementById("true-prob-row");
  let rowHtml = `<td class="row-label">Raw Outcome Probability</td>`;
  categories.forEach((cat) => {
    const formula =
      cat === "under"
        ? `SUM(cells where Home&minus;Away &lt; ${pivot})`
        : cat === "over"
        ? `SUM(cells where Home&minus;Away &gt; ${pivot})`
        : `SUM(cells where Home&minus;Away = ${pivot})`;
    rowHtml += `<td data-cell="tp-${cat}-cell"><input class="answer" type="number" step="0.01" id="tp-${cat}" data-formula="${formula}"></td>`;
  });
  row.innerHTML = rowHtml;
}

function buildOddsTable() {
  const point = pointForClassify(hdpLine);
  const body = document.getElementById("odds-table-body");
  body.innerHTML = "";
  const weight = middleWeight(point);
  const middleLabel = hasMiddleCategory(point) ? getMiddleLabel(point, "Push", BET_TEAM_LABELS) : "";
  const primaryKey = primaryBetTeamKey(point);
  const isDefaultLine = hdpLine === DEFAULT_LINE;

  BET_TEAM_KEYS.forEach((key) => {
    const label = BET_TEAM_LABELS[key];
    const prob = betTeamProb(key);

    let probFormula;
    let probRefs;
    if (weight === 0) {
      probFormula = `Same as Raw Outcome Probability (${label}) - half line, no middle category to adjust for`;
      probRefs = `tp-${key}-cell`;
    } else if (primaryKey && key !== primaryKey) {
      const otherLabel = BET_TEAM_LABELS[primaryKey];
      probFormula = `1 &minus; Settlement-Adjusted Fair Probability (${otherLabel})`;
      probRefs = `prob-${primaryKey}-cell`;
    } else if (weight === 1) {
      probFormula = `Raw Outcome Probability (${label}) / (1 &minus; Raw Outcome Probability (${middleLabel}))`;
      probRefs = `tp-${key}-cell,tp-middle-cell`;
    } else {
      probFormula = `Raw Outcome Probability (${label}) / (1 &minus; 0.5 &times; Raw Outcome Probability (${middleLabel}))`;
      probRefs = `tp-${key}-cell,tp-middle-cell`;
    }

    let cells = `
      <td class="row-label">${label}</td>
      <td data-cell="prob-${key}-cell"><input class="answer" type="number" step="0.01" id="prob-${key}" data-formula="${probFormula}" data-refs="${probRefs}"></td>
    `;
    if (isDefaultLine) {
      const oddsAttrs = isUndefinedOdds(prob) ? ' disabled placeholder="N/A"' : "";
      cells += `
        <td data-cell="euro-${key}-cell"><input class="answer" type="number" step="0.01" id="euro-${key}" data-formula="1 / Probability" data-refs="prob-${key}-cell"${oddsAttrs}></td>
        <td data-cell="hk-${key}-cell"><input class="answer" type="number" step="0.01" id="hk-${key}" data-formula="Euro &minus; 1" data-refs="euro-${key}-cell"${oddsAttrs}></td>
        <td><input class="answer" type="number" step="0.01" id="malay-${key}" data-formula="HK if HK &le; 1, else &minus;1 / HK" data-refs="hk-${key}-cell"${oddsAttrs}></td>
      `;
    } else {
      cells += `
        <td class="given-value" id="euro-${key}">&mdash;</td>
        <td class="given-value" id="hk-${key}">&mdash;</td>
        <td class="given-value" id="malay-${key}">&mdash;</td>
      `;
    }

    const row = document.createElement("tr");
    row.innerHTML = cells;
    body.appendChild(row);
  });
}

function checkOddsTable() {
  const point = pointForClassify(hdpLine);
  const results = [];

  getCategories(point).forEach((cat) => {
    results.push(markInput(document.getElementById(`tp-${cat}`), hdpStats[cat].prob, 0.005, 2));
  });

  BET_TEAM_KEYS.forEach((key) => {
    results.push(markInput(document.getElementById(`prob-${key}`), betTeamProb(key), 0.005, 2));
  });

  const isDefaultLine = hdpLine === DEFAULT_LINE;
  const probsCorrect = results.every(Boolean);

  BET_TEAM_KEYS.forEach((key) => {
    const prob = betTeamProb(key);
    if (isUndefinedOdds(prob)) return;
    const euro = toEuro(prob);
    const hk = toHK(euro);
    const malay = toMalay(hk);

    if (isDefaultLine) {
      results.push(markInput(document.getElementById(`euro-${key}`), euro, 0.005, 2));
      results.push(markInput(document.getElementById(`hk-${key}`), hk, 0.005, 2));
      results.push(markInput(document.getElementById(`malay-${key}`), malay, 0.005, 2));
    } else if (probsCorrect) {
      document.getElementById(`euro-${key}`).textContent = euro.toFixed(2);
      document.getElementById(`hk-${key}`).textContent = hk.toFixed(2);
      document.getElementById(`malay-${key}`).textContent = malay.toFixed(2);
    }
  });

  return results.every(Boolean);
}

function fillOddsTable() {
  const point = pointForClassify(hdpLine);
  getCategories(point).forEach((cat) => {
    document.getElementById(`tp-${cat}`).value = hdpStats[cat].prob.toFixed(2);
  });

  BET_TEAM_KEYS.forEach((key) => {
    document.getElementById(`prob-${key}`).value = betTeamProb(key).toFixed(2);
  });

  if (hdpLine === DEFAULT_LINE) {
    BET_TEAM_KEYS.forEach((key) => {
      const prob = betTeamProb(key);
      if (!isUndefinedOdds(prob)) {
        const euro = toEuro(prob);
        const hk = toHK(euro);
        const malay = toMalay(hk);
        document.getElementById(`euro-${key}`).value = euro.toFixed(2);
        document.getElementById(`hk-${key}`).value = hk.toFixed(2);
        document.getElementById(`malay-${key}`).value = malay.toFixed(2);
      }
    });
  }
  checkOddsTable();
}

// A "given" (non-default-line) Euro/HK/Malay cell isn't an input.answer,
// so the generic input-reset loop in resetAll skips it; this puts it back
// to its unrevealed placeholder instead of leaving a stale revealed value.
function resetOddsDisplay() {
  if (hdpLine === DEFAULT_LINE) return;
  BET_TEAM_KEYS.forEach((key) => {
    ["euro", "hk", "malay"].forEach((prefix) => {
      document.getElementById(`${prefix}-${key}`).textContent = "—";
    });
  });
}

function wireAnswerInputs(container) {
  container.querySelectorAll("input.answer").forEach((input) => {
    syncEmptyTooltip(input);
    input.addEventListener("input", () => syncEmptyTooltip(input));
    attachRefHighlight(input);
  });
}

function rebuildOddsSection(expected) {
  const point = pointForClassify(hdpLine);
  hdpStats = matrix.computeStats(classifyHDP, getCategories(point));
  buildTrueProbTable();
  buildOddsTable();

  wireAnswerInputs(document.getElementById("true-prob-table"));
  wireAnswerInputs(document.getElementById("odds-table"));
  getCategories(point).forEach((cat) => attachDimComplement(`tp-${cat}`, cat, () => hdpStats, () => getCategories(point)));
}

function resetAll() {
  document.querySelectorAll("input.answer").forEach((input) => {
    input.value = "";
    syncEmptyTooltip(input);
  });
  resetOddsDisplay();
  matrix.reset();
  picker.reset();
  lockSection("odds-section");
}

function onLineChange(event) {
  hdpLine = parseFloat(event.target.value);
  picker.rebuild(getCategories(pointForClassify(hdpLine)), categoryLabels(), categoryDescriptions());
  updateGuideText();
  rebuildOddsSection(expected);
  resetAll();
}

const expected = computeGoalStats();
const matrix = createMatrixClassifier({ idPrefix: "hdp", expected, categoryClass: CATEGORY_CLASS });
const picker = createCategoryPicker({
  containerId: "hdp-category-picker",
  categories: getCategories(pointForClassify(hdpLine)),
  categoryClass: CATEGORY_CLASS,
  labels: categoryLabels(),
  descriptions: categoryDescriptions(),
});

matrix.wireClicks(() => CATEGORY_CLASS[picker.getActive()]);
rebuildOddsSection(expected);

lockSection("odds-section");
updateGuideText();

document.getElementById("hdp-line-select").addEventListener("change", onLineChange);
document.getElementById("check-hdp").addEventListener("click", checkAllCells);
document.getElementById("reset-hdp").addEventListener("click", resetAll);
document.getElementById("fill-hdp").addEventListener("click", fillAllCells);
document.getElementById("check-odds-table").addEventListener("click", checkOddsTable);
document.getElementById("fill-odds-table").addEventListener("click", fillOddsTable);
document.getElementById("reset-btn").addEventListener("click", resetAll);
