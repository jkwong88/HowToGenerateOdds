const SPREAD_POINT = 2.75;
const SPREAD_AMOUNT = 0.1;

function computeFairOdds(expected) {
  const prob = computeOUCategoryProbabilities(expected, SPREAD_POINT);
  const probOver = ouBetTeamProbability(prob, SPREAD_POINT, "over");
  const probUnder = ouBetTeamProbability(prob, SPREAD_POINT, "under");
  const euroOver = toEuro(probOver);
  const euroUnder = toEuro(probUnder);
  const hkOver = toHK(euroOver);
  const hkUnder = toHK(euroUnder);

  return {
    probOver,
    probUnder,
    euroOver,
    euroUnder,
    hkOver,
    hkUnder,
    malayOver: toMalay(hkOver),
    malayUnder: toMalay(hkUnder),
  };
}

// Our company spreads the Malay odds first - by half the spread on each
// side, when split evenly - then HK/Euro/Probability are all derived from
// that shaved Malay, not from the original true probability. The resulting
// "probability" is now an implied one: it sums to more than 1, and that
// excess is the bookmaker's margin.
function computeSpreadOdds(fair) {
  const malayOver = fair.malayOver - SPREAD_AMOUNT / 2;
  const malayUnder = fair.malayUnder - SPREAD_AMOUNT / 2;
  const hkOver = malayToHK(malayOver);
  const hkUnder = malayToHK(malayUnder);
  const euroOver = hkOver + 1;
  const euroUnder = hkUnder + 1;

  return {
    probOver: 1 / euroOver,
    probUnder: 1 / euroUnder,
    euroOver,
    euroUnder,
    hkOver,
    hkUnder,
    malayOver,
    malayUnder,
  };
}

function buildFairRow(fair) {
  const row = document.getElementById("fair-row");
  row.innerHTML = `
    <td class="row-label">Fair Odds</td>
    <td class="given-value" data-cell="prob-over-fair-cell">${fair.probOver.toFixed(2)}</td>
    <td class="given-value" data-cell="prob-under-fair-cell">${fair.probUnder.toFixed(2)}</td>
    <td class="given-value" data-cell="euro-over-fair-cell">${fair.euroOver.toFixed(2)}</td>
    <td class="given-value" data-cell="euro-under-fair-cell">${fair.euroUnder.toFixed(2)}</td>
    <td class="given-value" data-cell="hk-over-fair-cell">${fair.hkOver.toFixed(2)}</td>
    <td class="given-value" data-cell="hk-under-fair-cell">${fair.hkUnder.toFixed(2)}</td>
    <td class="given-value" data-cell="malay-over-fair-cell">${fair.malayOver.toFixed(2)}</td>
    <td class="given-value" data-cell="malay-under-fair-cell">${fair.malayUnder.toFixed(2)}</td>
  `;
}

function buildSpreadRow() {
  const row = document.getElementById("spread-row");
  row.innerHTML = `
    <td class="row-label">With ${SPREAD_AMOUNT.toFixed(2)} Spread</td>
    <td data-cell="prob-over-spread-cell"><input class="answer" type="number" step="0.01" id="prob-over-spread" data-formula="1 / Euro" data-refs="euro-over-spread-cell"></td>
    <td data-cell="prob-under-spread-cell"><input class="answer" type="number" step="0.01" id="prob-under-spread" data-formula="1 / Euro" data-refs="euro-under-spread-cell"></td>
    <td data-cell="euro-over-spread-cell"><input class="answer" type="number" step="0.01" id="euro-over-spread" data-formula="HK + 1" data-refs="hk-over-spread-cell"></td>
    <td data-cell="euro-under-spread-cell"><input class="answer" type="number" step="0.01" id="euro-under-spread" data-formula="HK + 1" data-refs="hk-under-spread-cell"></td>
    <td data-cell="hk-over-spread-cell"><input class="answer" type="number" step="0.01" id="hk-over-spread" data-formula="Malay if Malay &ge; 0, else &minus;1 / Malay" data-refs="malay-over-spread-cell"></td>
    <td data-cell="hk-under-spread-cell"><input class="answer" type="number" step="0.01" id="hk-under-spread" data-formula="Malay if Malay &ge; 0, else &minus;1 / Malay" data-refs="malay-under-spread-cell"></td>
    <td data-cell="malay-over-spread-cell"><input class="answer" type="number" step="0.01" id="malay-over-spread" data-formula="Fair Malay (Over) &minus; Spread / 2" data-refs="malay-over-fair-cell"></td>
    <td data-cell="malay-under-spread-cell"><input class="answer" type="number" step="0.01" id="malay-under-spread" data-formula="Fair Malay (Under) &minus; Spread / 2" data-refs="malay-under-fair-cell"></td>
  `;
}

const SPREAD_FIELDS = [
  "prob-over-spread",
  "prob-under-spread",
  "euro-over-spread",
  "euro-under-spread",
  "hk-over-spread",
  "hk-under-spread",
  "malay-over-spread",
  "malay-under-spread",
];

function spreadFieldValues(spread) {
  return [
    spread.probOver,
    spread.probUnder,
    spread.euroOver,
    spread.euroUnder,
    spread.hkOver,
    spread.hkUnder,
    spread.malayOver,
    spread.malayUnder,
  ];
}

function checkSpread(spread) {
  const values = spreadFieldValues(spread);
  const results = SPREAD_FIELDS.map((id, i) => markInput(document.getElementById(id), values[i], 0.005, 2));
  return results.every(Boolean);
}

function fillSpread(spread) {
  const values = spreadFieldValues(spread);
  SPREAD_FIELDS.forEach((id, i) => {
    document.getElementById(id).value = values[i].toFixed(2);
  });
  checkSpread(spread);
}

function resetAll() {
  document.querySelectorAll("input.answer").forEach((input) => {
    input.value = "";
    syncEmptyTooltip(input);
  });
}

const expected = computeGoalStats();
const fairOdds = computeFairOdds(expected);
const spreadOdds = computeSpreadOdds(fairOdds);

buildFairRow(fairOdds);
buildSpreadRow();

document.querySelectorAll("input.answer").forEach((input) => {
  syncEmptyTooltip(input);
  input.addEventListener("input", () => syncEmptyTooltip(input));
  attachRefHighlight(input);
});

document.getElementById("check-spread").addEventListener("click", () => checkSpread(spreadOdds));
document.getElementById("fill-spread").addEventListener("click", () => fillSpread(spreadOdds));
document.getElementById("reset-btn").addEventListener("click", resetAll);
