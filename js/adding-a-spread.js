const SPREAD_AMOUNT = 0.1;

// Both market types reuse the exact same "split the spread evenly off the
// fair Malay odds" mechanic (see docs/adr/0003) - the axis math and BetTeam
// labels are shared (data.js's MARKET_AXIS_CONFIGS); only which fixed
// point/line is opened, and the title, are page-local.
const SPREAD_CONFIGS = {
  ou: {
    ...MARKET_AXIS_CONFIGS.ou,
    value: 2.75,
    title: "Main Line: 2.75",
  },
  hdp: {
    ...MARKET_AXIS_CONFIGS.hdp,
    // The fairest Handicap line for this dataset (see the sweep in 4.1) -
    // same role as Over/Under's 2.75, just on the Home - Away axis.
    value: -0.25,
    title: "Main Line: Home −0.25",
  },
};

let spreadMarketType = "ou";

function computeFairOdds(expected) {
  const config = SPREAD_CONFIGS[spreadMarketType];
  const point = config.classifyPoint(config.value);
  const prob = computeCategoryProbabilities(expected, point, config.axisValue);
  const probOver = ouBetTeamProbability(prob, point, "over");
  const probUnder = ouBetTeamProbability(prob, point, "under");
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
//
// Subtracting the spread can push a fair Malay already close to +/-1 past
// it (e.g. -0.97 - 0.05 = -1.02); normalizeMalay re-expresses that in valid
// notation (|Malay| <= 1) before it's shown or converted further.
function computeSpreadOdds(fair) {
  const malayOver = normalizeMalay(fair.malayOver - SPREAD_AMOUNT / 2);
  const malayUnder = normalizeMalay(fair.malayUnder - SPREAD_AMOUNT / 2);
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

function buildSpreadHeader() {
  const config = SPREAD_CONFIGS[spreadMarketType];
  document.getElementById("spread-title").textContent = `${config.title} | Pricing Spread: ${SPREAD_AMOUNT.toFixed(2)}`;
  document.getElementById("spread-label-row").innerHTML = `<th>${config.labels.over}</th><th>${config.labels.under}</th>`.repeat(
    4
  );
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
    <td class="row-label">After ${SPREAD_AMOUNT.toFixed(2)} Pricing Spread</td>
    <td data-cell="prob-over-spread-cell"><input class="answer" type="number" step="0.01" id="prob-over-spread" data-formula="1 / Euro" data-refs="euro-over-spread-cell"></td>
    <td data-cell="prob-under-spread-cell"><input class="answer" type="number" step="0.01" id="prob-under-spread" data-formula="1 / Euro" data-refs="euro-under-spread-cell"></td>
    <td data-cell="euro-over-spread-cell"><input class="answer" type="number" step="0.01" id="euro-over-spread" data-formula="HK + 1" data-refs="hk-over-spread-cell"></td>
    <td data-cell="euro-under-spread-cell"><input class="answer" type="number" step="0.01" id="euro-under-spread" data-formula="HK + 1" data-refs="hk-under-spread-cell"></td>
    <td data-cell="hk-over-spread-cell"><input class="answer" type="number" step="0.01" id="hk-over-spread" data-formula="Malay if Malay &ge; 0, else &minus;1 / Malay" data-refs="malay-over-spread-cell"></td>
    <td data-cell="hk-under-spread-cell"><input class="answer" type="number" step="0.01" id="hk-under-spread" data-formula="Malay if Malay &ge; 0, else &minus;1 / Malay" data-refs="malay-under-spread-cell"></td>
    <td data-cell="malay-over-spread-cell"><input class="answer" type="number" step="0.01" id="malay-over-spread" data-formula="Fair Malay (Over) &minus; Spread / 2 (then &minus;1 / result if |result| &gt; 1)" data-refs="malay-over-fair-cell"></td>
    <td data-cell="malay-under-spread-cell"><input class="answer" type="number" step="0.01" id="malay-under-spread" data-formula="Fair Malay (Under) &minus; Spread / 2 (then &minus;1 / result if |result| &gt; 1)" data-refs="malay-under-fair-cell"></td>
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

let fairOdds;
let spreadOdds;

function rebuildSpread() {
  buildSpreadHeader();
  fairOdds = computeFairOdds(expected);
  spreadOdds = computeSpreadOdds(fairOdds);

  buildFairRow(fairOdds);
  buildSpreadRow();

  document.querySelectorAll("input.answer").forEach((input) => {
    syncEmptyTooltip(input);
    input.addEventListener("input", () => syncEmptyTooltip(input));
    attachRefHighlight(input);
  });
}

function onMarketTypeChange(event) {
  spreadMarketType = event.target.value;
  rebuildSpread();
}

const expected = computeGoalStats();

rebuildSpread();

document.getElementById("spread-market-type-select").addEventListener("change", onMarketTypeChange);
document.getElementById("check-spread").addEventListener("click", () => checkSpread(spreadOdds));
document.getElementById("fill-spread").addEventListener("click", () => fillSpread(spreadOdds));
document.getElementById("reset-btn").addEventListener("click", resetAll);
