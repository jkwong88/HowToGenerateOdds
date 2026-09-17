function buildHistoryTable() {
  const body = document.getElementById("history-body");
  MATCH_HISTORY.forEach((match) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td class="row-label">${match.no}</td>
      <td data-cell="hist-home:${match.home}">${match.home}</td>
      <td data-cell="hist-away:${match.away}">${match.away}</td>
    `;
    body.appendChild(row);
  });
}

function buildFrequencyTables() {
  const countHeader = document.getElementById("count-header");
  const probHeader = document.getElementById("prob-header");
  GOAL_VALUES.forEach((v) => {
    countHeader.innerHTML += `<th>${v}</th>`;
    probHeader.innerHTML += `<th>${v}</th>`;
  });

  const rowLabels = { home: "Home", away: "Away" };
  const rows = [
    { key: "home", count: "count-home-row", prob: "prob-home-row" },
    { key: "away", count: "count-away-row", prob: "prob-away-row" },
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

function checkPart1() {
  unlockSection("part2");
  return true;
}

function checkPart2(expected) {
  const countMap = { home: expected.countHome, away: expected.countAway };
  const results = [];

  ["home", "away"].forEach((key) => {
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
  const probMap = { home: expected.probHome, away: expected.probAway };
  const results = [];

  ["home", "away"].forEach((key) => {
    GOAL_VALUES.forEach((v) => {
      const input = document.getElementById(`prob-${key}-${v}`);
      results.push(markInput(input, probMap[key][v]));
    });
  });

  return results.every(Boolean);
}

function fillPart1() {
  checkPart1();
}

function fillPart2(expected) {
  const countMap = { home: expected.countHome, away: expected.countAway };
  ["home", "away"].forEach((key) => {
    GOAL_VALUES.forEach((v) => {
      document.getElementById(`count-${key}-${v}`).value = countMap[key][v];
    });
  });
  checkPart2(expected);
}

function fillPart3(expected) {
  const probMap = { home: expected.probHome, away: expected.probAway };
  ["home", "away"].forEach((key) => {
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

document.getElementById("check-part1").addEventListener("click", checkPart1);
document.getElementById("check-part2").addEventListener("click", () => checkPart2(expected));
document.getElementById("check-part3").addEventListener("click", () => checkPart3(expected));
document.getElementById("fill-part1").addEventListener("click", fillPart1);
document.getElementById("fill-part2").addEventListener("click", () => fillPart2(expected));
document.getElementById("fill-part3").addEventListener("click", () => fillPart3(expected));
document.getElementById("reset-btn").addEventListener("click", resetAll);
