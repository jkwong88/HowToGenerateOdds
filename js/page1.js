function buildHistoryTable() {
  const body = document.getElementById("history-body");
  MATCH_HISTORY.forEach((match) => {
    const row = document.createElement("tr");
    const total = match.home + match.away;
    row.innerHTML = `
      <td class="row-label">${match.no}</td>
      <td data-cell="hist-home:${match.home}">${match.home}</td>
      <td data-cell="hist-away:${match.away}">${match.away}</td>
      <td data-cell="hist-total:${total}"><input class="answer" type="number" step="0.1" id="total-${match.no}" data-formula="Home + Away"></td>
    `;
    body.appendChild(row);
  });

  document.getElementById("avg-home").dataset.formula = "SUM(Home) / 10";
  document.getElementById("avg-away").dataset.formula = "SUM(Away) / 10";
  document.getElementById("avg-total").dataset.formula = "SUM(Total Score) / 10";
}

function buildFrequencyTables() {
  const countHeader = document.getElementById("count-header");
  const probHeader = document.getElementById("prob-header");
  GOAL_VALUES.forEach((v) => {
    countHeader.innerHTML += `<th>${v}</th>`;
    probHeader.innerHTML += `<th>${v}</th>`;
  });

  const rowLabels = { home: "Home", away: "Away", total: "Total" };
  const rows = [
    { key: "home", count: "count-home-row", prob: "prob-home-row" },
    { key: "away", count: "count-away-row", prob: "prob-away-row" },
    { key: "total", count: "count-total-row", prob: "prob-total-row" },
  ];

  rows.forEach(({ key, count, prob }) => {
    const countRow = document.getElementById(count);
    const probRow = document.getElementById(prob);
    const label = rowLabels[key];
    GOAL_VALUES.forEach((v) => {
      countRow.innerHTML += `<td data-cell="count-${key}:${v}"><input class="answer" type="number" step="1" id="count-${key}-${v}" data-formula="COUNTIF(${label}, ${v})" data-refs="hist-${key}:${v}"></td>`;
      probRow.innerHTML += `<td><input class="answer" type="number" step="0.1" id="prob-${key}-${v}" data-formula="Count(${label} = ${v}) / 10" data-refs="count-${key}:${v}"></td>`;
    });
  });
}

function checkPart1(expected) {
  const results = MATCH_HISTORY.map((m) =>
    markInput(document.getElementById(`total-${m.no}`), expected.expectedTotals[m.no])
  );
  results.push(markInput(document.getElementById("avg-home"), expected.avgHome));
  results.push(markInput(document.getElementById("avg-away"), expected.avgAway));
  results.push(markInput(document.getElementById("avg-total"), expected.avgTotal));

  const passed = results.every(Boolean);
  if (passed) unlockSection("part2");
  return passed;
}

function checkPart2(expected) {
  const countMap = { home: expected.countHome, away: expected.countAway, total: expected.countTotal };
  const results = [];

  ["home", "away", "total"].forEach((key) => {
    GOAL_VALUES.forEach((v) => {
      const input = document.getElementById(`count-${key}-${v}`);
      results.push(markInput(input, countMap[key][v]));
    });
  });

  const passed = results.every(Boolean);
  if (passed) unlockSection("part3");
  return passed;
}

function checkPart3(expected) {
  const probMap = { home: expected.probHome, away: expected.probAway, total: expected.probTotal };
  const results = [];

  ["home", "away", "total"].forEach((key) => {
    GOAL_VALUES.forEach((v) => {
      const input = document.getElementById(`prob-${key}-${v}`);
      results.push(markInput(input, probMap[key][v]));
    });
  });

  return results.every(Boolean);
}

function fillPart1(expected) {
  MATCH_HISTORY.forEach((m) => {
    document.getElementById(`total-${m.no}`).value = expected.expectedTotals[m.no].toFixed(1);
  });
  document.getElementById("avg-home").value = expected.avgHome.toFixed(1);
  document.getElementById("avg-away").value = expected.avgAway.toFixed(1);
  document.getElementById("avg-total").value = expected.avgTotal.toFixed(1);
  checkPart1(expected);
}

function fillPart2(expected) {
  const countMap = { home: expected.countHome, away: expected.countAway, total: expected.countTotal };
  ["home", "away", "total"].forEach((key) => {
    GOAL_VALUES.forEach((v) => {
      document.getElementById(`count-${key}-${v}`).value = countMap[key][v];
    });
  });
  checkPart2(expected);
}

function fillPart3(expected) {
  const probMap = { home: expected.probHome, away: expected.probAway, total: expected.probTotal };
  ["home", "away", "total"].forEach((key) => {
    GOAL_VALUES.forEach((v) => {
      document.getElementById(`prob-${key}-${v}`).value = probMap[key][v].toFixed(1);
    });
  });
  checkPart3(expected);
}

function resetAll() {
  document.querySelectorAll("input.answer").forEach((input) => {
    input.value = "";
    syncEmptyTooltip(input);
  });
  lockSection("part2");
  lockSection("part3");
}

buildHistoryTable();
buildFrequencyTables();
const expected = computeGoalStats();

document.querySelectorAll("input.answer").forEach((input) => {
  syncEmptyTooltip(input);
  input.addEventListener("input", () => syncEmptyTooltip(input));
  attachRefHighlight(input);
});

lockSection("part2");
lockSection("part3");

document.getElementById("check-part1").addEventListener("click", () => checkPart1(expected));
document.getElementById("check-part2").addEventListener("click", () => checkPart2(expected));
document.getElementById("check-part3").addEventListener("click", () => checkPart3(expected));
document.getElementById("fill-part1").addEventListener("click", () => fillPart1(expected));
document.getElementById("fill-part2").addEventListener("click", () => fillPart2(expected));
document.getElementById("fill-part3").addEventListener("click", () => fillPart3(expected));
document.getElementById("reset-btn").addEventListener("click", resetAll);
