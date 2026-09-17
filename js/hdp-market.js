const CATEGORY_CLASS = { under: "marked-under", middle: "marked-middle", over: "marked-over" };
const BET_TEAM_KEYS = ["under", "over"];
const BET_TEAM_LABELS = { under: "Away Covers", over: "Home Covers" };

let hdpLine = 0;
let hdpPhaseIndex = 0;
let hdpStats = null;

// The dropdown shows the standard Asian Handicap line applied to Home
// (negative = Home favorite/giving goals, positive = Home underdog/getting
// goals). classifyTotal/getPointType/etc. compare Home - Away directly
// against a point, so the line has to be negated first: Home covers a line
// L when (Home - Away) > -L, i.e. when Home - Away > pointForClassify.
function pointForClassify(line) {
  return -line;
}

// Mirrors over-under-market.js's getMiddleLabel, but framed from Home's
// side (the "over" category here) instead of the Over bettor's side -
// point above its pivot means Home is the primary/directly-computed side,
// so a draw on that pivot is a net half lose for Home; below its pivot, a
// net half win.
function getMiddleLabel(point) {
  const type = getPointType(point);
  if (type === "integer") return "Push";
  const pivot = Math.round(point);
  return point > pivot ? "Half Lose" : "Half Win";
}

function getCategories(point) {
  return hasMiddleCategory(point) ? ["under", "middle", "over"] : ["under", "over"];
}

function pivotForDisplay(point) {
  return hasMiddleCategory(point) ? Math.round(point) : point;
}

function buildHDPMatrixTable(expected) {
  const header = document.getElementById("hdp-matrix-header");
  MATRIX_GOAL_VALUES.forEach((v) => {
    header.innerHTML += `<th>${v}</th>`;
  });

  const body = document.getElementById("hdp-matrix-body");
  MATRIX_GOAL_VALUES.forEach((home) => {
    const row = document.createElement("tr");
    let cells = `<td class="row-label">${home}</td>`;
    MATRIX_GOAL_VALUES.forEach((away) => {
      const value = matrixExpected(expected, home, away).toFixed(2);
      cells += `<td><button type="button" class="oe-cell" id="hdp-cell-${home}-${away}" data-cell="hdp-cell:${home}-${away}">${value}</button></td>`;
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
      const btn = document.getElementById(`hdp-cell-${home}-${away}`);
      btn.addEventListener("click", () => {
        if (btn.disabled) return;
        btn.closest("td").classList.remove("cell-correct", "cell-wrong");
        const point = pointForClassify(hdpLine);
        const targetCategory = getCategories(point)[hdpPhaseIndex];
        const targetClass = CATEGORY_CLASS[targetCategory];
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

function updateStepUI() {
  const point = pointForClassify(hdpLine);
  const hasMiddle = hasMiddleCategory(point);
  const middleLabel = hasMiddle ? getMiddleLabel(point) : "";
  const pivot = pivotForDisplay(point);

  document.getElementById("hdp-step-2").style.display = hasMiddle ? "" : "none";
  document.getElementById("complete-middle").textContent = middleLabel;

  const note1 = document.getElementById("step-note-1");
  const note2 = document.getElementById("step-note-2");
  const note3 = document.getElementById("step-note-3");

  note1.innerHTML = `Step 1: click every cell where Home &minus; Away is <strong>under ${pivot}</strong>, then click Away Covers.`;

  if (hasMiddle) {
    note2.style.display = "";
    note2.innerHTML = `Step 2: click every cell where Home &minus; Away <strong>equals ${pivot}</strong> (${middleLabel}), then click ${middleLabel}.`;
    note3.innerHTML = `Step 3: click every remaining cell (Home &minus; Away is <strong>over ${pivot}</strong>), then click Home Covers.`;
  } else {
    note2.style.display = "none";
    note3.innerHTML = `Step 2: click every remaining cell (Home &minus; Away is <strong>over ${pivot}</strong>), then click Home Covers.`;
  }
}

function updateStepHighlight() {
  const point = pointForClassify(hdpLine);
  const hasMiddle = hasMiddleCategory(point);
  const step2Locked = document.getElementById("hdp-step-2").classList.contains("locked");
  const step3Locked = document.getElementById("hdp-step-3").classList.contains("locked");
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

// "Away Covers" and the middle step just move to the next step - neither
// checks anything. If there's no middle category, "Away Covers" jumps
// straight to step 3.
function completeAway() {
  hdpPhaseIndex = 1;
  const point = pointForClassify(hdpLine);
  if (hasMiddleCategory(point)) {
    unlockSection("hdp-step-2");
  } else {
    unlockSection("hdp-step-3");
  }
  updateStepHighlight();
}

function completeMiddle() {
  hdpPhaseIndex = 2;
  unlockSection("hdp-step-3");
  updateStepHighlight();
}

// "Home Covers" is the only place the whole grid actually gets verified.
function checkAllCells() {
  let allCorrect = true;
  const point = pointForClassify(hdpLine);

  MATRIX_GOAL_VALUES.forEach((home) => {
    MATRIX_GOAL_VALUES.forEach((away) => {
      const btn = document.getElementById(`hdp-cell-${home}-${away}`);
      const cell = btn.closest("td");
      const correctClass = CATEGORY_CLASS[classifyTotal(home - away, point)];
      const isCorrect = btn.classList.contains(correctClass);
      cell.classList.toggle("cell-correct", isCorrect);
      cell.classList.toggle("cell-wrong", !isCorrect);
      if (!isCorrect) allCorrect = false;
    });
  });

  if (allCorrect) {
    MATRIX_GOAL_VALUES.forEach((home) => {
      MATRIX_GOAL_VALUES.forEach((away) => {
        document.getElementById(`hdp-cell-${home}-${away}`).disabled = true;
      });
    });
    unlockSection("odds-section");
  }

  updateStepHighlight();
  return allCorrect;
}

function fillAllCells() {
  const point = pointForClassify(hdpLine);
  MATRIX_GOAL_VALUES.forEach((home) => {
    MATRIX_GOAL_VALUES.forEach((away) => {
      const btn = document.getElementById(`hdp-cell-${home}-${away}`);
      Object.values(CATEGORY_CLASS).forEach((c) => btn.classList.remove(c));
      btn.classList.add(CATEGORY_CLASS[classifyTotal(home - away, point)]);
    });
  });
  checkAllCells();
}

function computeHDPStats(expected) {
  const point = pointForClassify(hdpLine);
  const categories = getCategories(point);
  const catProb = computeHDPCategoryProbabilities(expected, point);
  const refs = {};
  categories.forEach((cat) => {
    refs[cat] = [];
  });

  MATRIX_GOAL_VALUES.forEach((home) => {
    MATRIX_GOAL_VALUES.forEach((away) => {
      const category = classifyTotal(home - away, point);
      refs[category].push(`hdp-cell:${home}-${away}`);
    });
  });

  const stats = {};
  categories.forEach((cat) => {
    stats[cat] = { prob: catProb[cat], refs: refs[cat].join(",") };
  });
  return stats;
}

// A push is excluded entirely from the bettable probability, a half win/half
// lose only half-excluded, and there's nothing to exclude at a half point.
// Delegates to the shared ouBetTeamProbability (js/data.js), adapting
// hdpStats's {prob, refs} shape to the plain {key: prob} it expects.
function betTeamProb(key) {
  const point = pointForClassify(hdpLine);
  const prob = {};
  Object.keys(hdpStats).forEach((k) => {
    prob[k] = hdpStats[k].prob;
  });
  return ouBetTeamProbability(prob, point, key);
}

// While hovering a True Probability cell, fade the *other* categories'
// matrix cells into their own background so only the summed cells stay
// legible. Reads hdpStats/hdpLine live, so it keeps working after a rebuild.
function attachDimComplement(key) {
  const input = document.getElementById(`tp-${key}`);
  if (!input) return;
  const cell = input.closest("td");

  function setDim(on) {
    const point = pointForClassify(hdpLine);
    getCategories(point)
      .filter((k) => k !== key)
      .forEach((k) => {
        if (!hdpStats[k]) return;
        hdpStats[k].refs.split(",").forEach((ref) => {
          const trimmed = ref.trim();
          if (!trimmed) return;
          document.querySelectorAll(`[data-cell="${trimmed}"]`).forEach((el) => {
            el.classList.toggle("dim-text", on);
          });
        });
      });
  }

  cell.addEventListener("mouseenter", () => {
    if (cell.dataset.tooltip && cell.dataset.tooltip === input.dataset.formula) setDim(true);
  });
  cell.addEventListener("mouseleave", () => setDim(false));
}

function buildTrueProbTable() {
  const point = pointForClassify(hdpLine);
  const categories = getCategories(point);
  const pivot = pivotForDisplay(point);
  const labels = { under: "Away Covers", middle: getMiddleLabel(point), over: "Home Covers" };

  const header = document.getElementById("true-prob-header");
  header.innerHTML = "<th></th>";
  categories.forEach((cat) => {
    header.innerHTML += `<th>${labels[cat]}</th>`;
  });

  const row = document.getElementById("true-prob-row");
  let rowHtml = `<td class="row-label">True Probability</td>`;
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
  const middleLabel = hasMiddleCategory(point) ? getMiddleLabel(point) : "";
  const primaryKey = primaryBetTeamKey(point);

  BET_TEAM_KEYS.forEach((key) => {
    const label = BET_TEAM_LABELS[key];
    const prob = betTeamProb(key);
    const oddsAttrs = isUndefinedOdds(prob) ? ' disabled placeholder="N/A"' : "";

    let probFormula;
    let probRefs;
    if (weight === 0) {
      probFormula = `Same as True Probability (${label})`;
      probRefs = `tp-${key}-cell`;
    } else if (primaryKey && key !== primaryKey) {
      const otherLabel = BET_TEAM_LABELS[primaryKey];
      probFormula = `1 &minus; BetTeam Probability (${otherLabel})`;
      probRefs = `prob-${primaryKey}-cell`;
    } else if (weight === 1) {
      probFormula = `True Probability (${label}) / (1 &minus; True Probability (${middleLabel}))`;
      probRefs = `tp-${key}-cell,tp-middle-cell`;
    } else {
      probFormula = `True Probability (${label}) / (1 &minus; 0.5 &times; True Probability (${middleLabel}))`;
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
  const point = pointForClassify(hdpLine);
  const results = [];

  getCategories(point).forEach((cat) => {
    results.push(markInput(document.getElementById(`tp-${cat}`), hdpStats[cat].prob, 0.005, 2));
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
  const point = pointForClassify(hdpLine);
  getCategories(point).forEach((cat) => {
    document.getElementById(`tp-${cat}`).value = hdpStats[cat].prob.toFixed(2);
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
  hdpStats = computeHDPStats(expected);
  buildTrueProbTable();
  buildOddsTable();

  wireAnswerInputs(document.getElementById("true-prob-table"));
  wireAnswerInputs(document.getElementById("odds-table"));
  const point = pointForClassify(hdpLine);
  getCategories(point).forEach((cat) => attachDimComplement(cat));
}

function resetAll() {
  document.querySelectorAll("input.answer").forEach((input) => {
    input.value = "";
    syncEmptyTooltip(input);
  });

  MATRIX_GOAL_VALUES.forEach((home) => {
    MATRIX_GOAL_VALUES.forEach((away) => {
      const btn = document.getElementById(`hdp-cell-${home}-${away}`);
      Object.values(CATEGORY_CLASS).forEach((c) => btn.classList.remove(c));
      btn.closest("td").classList.remove("cell-correct", "cell-wrong");
      btn.disabled = false;
    });
  });

  hdpPhaseIndex = 0;
  lockSection("hdp-step-2");
  lockSection("hdp-step-3");
  lockSection("odds-section");
  updateStepUI();
  updateStepHighlight();
}

function onLineChange(event) {
  hdpLine = parseFloat(event.target.value);
  rebuildOddsSection(expected);
  resetAll();
}

const expected = computeGoalStats();

buildHDPMatrixTable(expected);
wireMatrixClicks();
rebuildOddsSection(expected);

lockSection("hdp-step-2");
lockSection("hdp-step-3");
lockSection("odds-section");
updateStepUI();
updateStepHighlight();

document.getElementById("hdp-line-select").addEventListener("change", onLineChange);
document.getElementById("complete-away").addEventListener("click", completeAway);
document.getElementById("complete-middle").addEventListener("click", completeMiddle);
document.getElementById("complete-home").addEventListener("click", checkAllCells);
document.getElementById("reset-hdp").addEventListener("click", resetAll);
document.getElementById("fill-hdp").addEventListener("click", fillAllCells);
document.getElementById("check-odds-table").addEventListener("click", checkOddsTable);
document.getElementById("fill-odds-table").addEventListener("click", fillOddsTable);
document.getElementById("reset-btn").addEventListener("click", resetAll);
