const SWEEP_POINTS = [];
for (let p = 0.25; p <= 4; p += 0.25) {
  SWEEP_POINTS.push(Math.round(p * 100) / 100);
}

let marketCount = 1;

function computeSweepRows(expected) {
  return SWEEP_POINTS.map((point) => {
    const prob = computeOUCategoryProbabilities(expected, point);
    const over = ouBetTeamProbability(prob, point, "over");
    const under = ouBetTeamProbability(prob, point, "under");
    return { point, over, under };
  });
}

// A bookmaker's natural market(s) are whichever points split Over/Under
// closest to 50/50, since that draws the most balanced two-way action -
// with more than one market open, they'd pick the closest few, not just one.
function findMainMarketPoints(rows, count) {
  return [...rows]
    .sort((a, b) => Math.abs(a.over - 0.5) - Math.abs(b.over - 0.5))
    .slice(0, count)
    .map((row) => row.point)
    .sort((a, b) => a - b);
}

function formatOdds(prob) {
  if (isUndefinedOdds(prob)) return { euro: "N/A", hk: "N/A", malay: "N/A" };
  const euro = toEuro(prob);
  const hk = toHK(euro);
  const malay = toMalay(hk);
  return { euro: euro.toFixed(2), hk: hk.toFixed(2), malay: malay.toFixed(2) };
}

function buildSweepTable(rows) {
  const body = document.getElementById("ou-sweep-body");
  body.innerHTML = "";

  rows.forEach(({ point, over, under }) => {
    const overOdds = formatOdds(over);
    const underOdds = formatOdds(under);
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><input type="checkbox" name="main-market" id="market-${point}" value="${point}"></td>
      <td class="row-label">${point}</td>
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

function updateInstructions() {
  const note = document.getElementById("market-step-note");
  const word = marketCount === 1 ? "point" : "points";
  note.textContent =
    `Select the ${marketCount} ${word} where Over and Under True Probability are closest to a 50/50 split, then Check.`;
}

function checkedPoints() {
  return Array.from(document.querySelectorAll('input[name="main-market"]:checked'))
    .map((input) => parseFloat(input.value))
    .sort((a, b) => a - b);
}

function clearRowFeedback() {
  document.querySelectorAll("#ou-sweep-body tr").forEach((row) => {
    row.classList.remove("selected-correct", "selected-wrong");
  });
}

function checkMarket(correctPoints) {
  clearRowFeedback();
  const picked = checkedPoints();

  picked.forEach((point) => {
    const row = document.getElementById(`market-${point}`).closest("tr");
    row.classList.add(correctPoints.includes(point) ? "selected-correct" : "selected-wrong");
  });

  return picked.length === correctPoints.length && picked.every((point) => correctPoints.includes(point));
}

function fillMarket(correctPoints) {
  document.querySelectorAll('input[name="main-market"]').forEach((input) => {
    input.checked = false;
  });
  correctPoints.forEach((point) => {
    document.getElementById(`market-${point}`).checked = true;
  });
  checkMarket(correctPoints);
}

function resetAll() {
  document.querySelectorAll('input[name="main-market"]').forEach((input) => {
    input.checked = false;
  });
  clearRowFeedback();
}

function onMarketCountChange(event) {
  marketCount = parseInt(event.target.value, 10);
  updateInstructions();
  resetAll();
}

const expected = computeGoalStats();
const sweepRows = computeSweepRows(expected);

buildSweepTable(sweepRows);
updateInstructions();

document.getElementById("market-count-select").addEventListener("change", onMarketCountChange);
document.getElementById("check-market").addEventListener("click", () =>
  checkMarket(findMainMarketPoints(sweepRows, marketCount))
);
document.getElementById("fill-market").addEventListener("click", () =>
  fillMarket(findMainMarketPoints(sweepRows, marketCount))
);
document.getElementById("reset-btn").addEventListener("click", resetAll);
