const OU_SWEEP_POINTS = [];
for (let p = 0.5; p <= 4; p += 0.25) {
  OU_SWEEP_POINTS.push(Math.round(p * 100) / 100);
}

const HDP_SWEEP_LINES = [];
for (let l = -2; l <= 2; l += 0.25) {
  HDP_SWEEP_LINES.push(Math.round(l * 100) / 100);
}

// Both market types reduce to the same shape: sweep a set of displayed
// values, classify the matrix by some axis at each one, and find whichever
// value(s) split their two BetTeam outcomes closest to 50/50. The axis math
// and BetTeam labels are shared (data.js's MARKET_AXIS_CONFIGS, see docs/adr/
// 0003); only the sweep range, title, and value formatting are page-local.
const MARKET_CONFIGS = {
  ou: {
    ...MARKET_AXIS_CONFIGS.ou,
    sweepValues: OU_SWEEP_POINTS,
    title: "Over / Under Lines (0.50–4.00)",
    pointHeader: "Line",
    formatValue: (value) => String(value),
  },
  hdp: {
    ...MARKET_AXIS_CONFIGS.hdp,
    sweepValues: HDP_SWEEP_LINES,
    title: "Handicap Lines (−2.00 to +2.00)",
    pointHeader: "Line",
    formatValue: (value) => (value > 0 ? `+${value}` : String(value)),
  },
};

let marketType = "ou";
let marketCount = 1;

function idKey(value) {
  return String(value).replace(/\./g, "_").replace(/-/g, "m");
}

function computeSweepRows() {
  const config = MARKET_CONFIGS[marketType];
  return config.sweepValues.map((value) => {
    const point = config.classifyPoint(value);
    const prob = computeCategoryProbabilities(expected, point, config.axisValue);
    const over = ouBetTeamProbability(prob, point, "over");
    const under = ouBetTeamProbability(prob, point, "under");
    return { value, over, under };
  });
}

// A bookmaker's natural market(s) are whichever points split the two
// BetTeam outcomes closest to 50/50, since that draws the most balanced
// two-way action - with more than one market open, they'd pick the closest
// few, not just one.
function findMainMarketValues(rows, count) {
  return [...rows]
    .sort((a, b) => Math.abs(a.over - 0.5) - Math.abs(b.over - 0.5))
    .slice(0, count)
    .map((row) => row.value)
    .sort((a, b) => a - b);
}

function formatOdds(prob) {
  if (isUndefinedOdds(prob)) return { euro: "N/A", hk: "N/A", malay: "N/A" };
  const euro = toEuro(prob);
  const hk = toHK(euro);
  const malay = toMalay(hk);
  return { euro: euro.toFixed(2), hk: hk.toFixed(2), malay: malay.toFixed(2) };
}

// The label row repeats (Over, Under) once per column-group (True
// Probability, Euro, HK, Malay), so it's the same two <th>s four times over.
function buildSweepHeader() {
  const config = MARKET_CONFIGS[marketType];
  document.getElementById("sweep-title").textContent = config.title;
  document.getElementById("sweep-point-header").textContent = config.pointHeader;
  document.getElementById("sweep-label-row").innerHTML = `<th>${config.labels.over}</th><th>${config.labels.under}</th>`.repeat(
    4
  );
}

function buildSweepTable(rows) {
  const config = MARKET_CONFIGS[marketType];
  const body = document.getElementById("ou-sweep-body");
  body.innerHTML = "";

  rows.forEach(({ value, over, under }) => {
    const overOdds = formatOdds(over);
    const underOdds = formatOdds(under);
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><input type="checkbox" name="main-market" id="market-${idKey(value)}" value="${value}"></td>
      <td class="row-label">${config.formatValue(value)}</td>
      <td>${over.toFixed(2)}</td>
      <td>${under.toFixed(2)}</td>
      <td>${overOdds.euro}</td>
      <td>${underOdds.euro}</td>
      <td>${overOdds.hk}</td>
      <td>${underOdds.hk}</td>
      <td>${overOdds.malay}</td>
      <td>${underOdds.malay}</td>
    `;
    body.appendChild(row);
  });
}

const MARKET_COUNT_WORDS = { 2: "two", 3: "three" };

function updateInstructions() {
  const note = document.getElementById("market-step-note");
  const nounPhrase = marketCount === 1 ? "the line" : `the ${MARKET_COUNT_WORDS[marketCount]} lines`;
  note.textContent = `Select ${nounPhrase} where the two fair probabilities are closest to 50% each, then click Check.`;
}

function checkedValues() {
  return Array.from(document.querySelectorAll('input[name="main-market"]:checked'))
    .map((input) => parseFloat(input.value))
    .sort((a, b) => a - b);
}

function clearRowFeedback() {
  document.querySelectorAll("#ou-sweep-body tr").forEach((row) => {
    row.classList.remove("selected-correct", "selected-wrong");
  });
}

function checkMarket(correctValues) {
  clearRowFeedback();
  const picked = checkedValues();

  picked.forEach((value) => {
    const row = document.getElementById(`market-${idKey(value)}`).closest("tr");
    row.classList.add(correctValues.includes(value) ? "selected-correct" : "selected-wrong");
  });

  return picked.length === correctValues.length && picked.every((value) => correctValues.includes(value));
}

function fillMarket(correctValues) {
  document.querySelectorAll('input[name="main-market"]').forEach((input) => {
    input.checked = false;
  });
  correctValues.forEach((value) => {
    document.getElementById(`market-${idKey(value)}`).checked = true;
  });
  checkMarket(correctValues);
}

function resetAll() {
  document.querySelectorAll('input[name="main-market"]').forEach((input) => {
    input.checked = false;
  });
  clearRowFeedback();
}

let sweepRows = [];

function rebuildSweep() {
  buildSweepHeader();
  sweepRows = computeSweepRows();
  buildSweepTable(sweepRows);
  updateInstructions();
  resetAll();
}

function onMarketTypeChange(event) {
  marketType = event.target.value;
  rebuildSweep();
}

function onMarketCountChange(event) {
  marketCount = parseInt(event.target.value, 10);
  updateInstructions();
  resetAll();
}

const expected = computeGoalStats();

rebuildSweep();

document.getElementById("market-type-select").addEventListener("change", onMarketTypeChange);
document.getElementById("market-count-select").addEventListener("change", onMarketCountChange);
document.getElementById("check-market").addEventListener("click", () =>
  checkMarket(findMainMarketValues(sweepRows, marketCount))
);
document.getElementById("fill-market").addEventListener("click", () =>
  fillMarket(findMainMarketValues(sweepRows, marketCount))
);
document.getElementById("reset-btn").addEventListener("click", resetAll);
