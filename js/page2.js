function buildGivenTable(expected) {
  const header = document.getElementById("given-header");
  GOAL_VALUES.forEach((v) => {
    header.innerHTML += `<th>${v}</th>`;
  });

  const rows = [
    { id: "given-home-row", map: expected.probHome },
    { id: "given-away-row", map: expected.probAway },
    { id: "given-total-row", map: expected.probTotal },
  ];

  rows.forEach(({ id, map }) => {
    const row = document.getElementById(id);
    GOAL_VALUES.forEach((v) => {
      row.innerHTML += `<td class="given-value">${map[v].toFixed(1)}</td>`;
    });
  });
}

function isEdgeCell(r, c) {
  return r >= 3 || c >= 3;
}

function buildMatrixTable() {
  const header = document.getElementById("matrix-header");
  GOAL_VALUES.forEach((v) => {
    header.innerHTML += `<th>${v}</th>`;
  });

  const body = document.getElementById("matrix-body");
  GOAL_VALUES.forEach((r) => {
    const row = document.createElement("tr");
    let cells = `<td class="row-label">${r}</td>`;
    GOAL_VALUES.forEach((c) => {
      const disabledAttr = isEdgeCell(r, c) ? " disabled" : "";
      cells += `<td><input class="answer" type="number" step="0.01" id="matrix-${r}-${c}" data-formula="P(Home=${r}) &times; P(Away=${c})"${disabledAttr}></td>`;
    });
    row.innerHTML = cells;
    body.appendChild(row);
  });
}

function matrixExpected(expected, r, c) {
  return expected.probHome[r] * expected.probAway[c];
}

// Goals 3+ carry little probability mass in this dataset and aren't the point
// of the exercise, so those cells stay hidden and disabled until the user
// solves the 3x3 core (Home <= 2, Away <= 2) or gives up via Fill Answers.
function hideEdgeCells() {
  GOAL_VALUES.forEach((r) => {
    GOAL_VALUES.forEach((c) => {
      if (!isEdgeCell(r, c)) return;
      const input = document.getElementById(`matrix-${r}-${c}`);
      input.value = "";
      input.classList.remove("correct", "incorrect");
      setCellTooltip(input, "");
      input.disabled = true;
    });
  });
}

function revealEdgeCells(expected) {
  GOAL_VALUES.forEach((r) => {
    GOAL_VALUES.forEach((c) => {
      if (!isEdgeCell(r, c)) return;
      const input = document.getElementById(`matrix-${r}-${c}`);
      input.value = matrixExpected(expected, r, c).toFixed(2);
      markInput(input, matrixExpected(expected, r, c), 0.005, 2);
      input.disabled = true;
    });
  });
}

function checkCoreCells(expected) {
  const results = [];
  GOAL_VALUES.forEach((r) => {
    GOAL_VALUES.forEach((c) => {
      if (isEdgeCell(r, c)) return;
      const input = document.getElementById(`matrix-${r}-${c}`);
      results.push(markInput(input, matrixExpected(expected, r, c), 0.005, 2));
    });
  });
  return results.every(Boolean);
}

function checkMatrix(expected) {
  const passed = checkCoreCells(expected);
  if (passed) revealEdgeCells(expected);
  return passed;
}

function fillMatrix(expected) {
  GOAL_VALUES.forEach((r) => {
    GOAL_VALUES.forEach((c) => {
      if (isEdgeCell(r, c)) return;
      document.getElementById(`matrix-${r}-${c}`).value = matrixExpected(expected, r, c).toFixed(2);
    });
  });
  checkMatrix(expected);
}

function resetAll() {
  document.querySelectorAll("input.answer").forEach((input) => {
    input.value = "";
    syncEmptyTooltip(input);
  });
  hideEdgeCells();
}

const expected = computeGoalStats();
buildGivenTable(expected);
buildMatrixTable();

document.querySelectorAll("input.answer").forEach((input) => {
  syncEmptyTooltip(input);
  input.addEventListener("input", () => syncEmptyTooltip(input));
});

hideEdgeCells();

document.getElementById("check-matrix").addEventListener("click", () => checkMatrix(expected));
document.getElementById("fill-matrix").addEventListener("click", () => fillMatrix(expected));
document.getElementById("reset-btn").addEventListener("click", resetAll);
document.getElementById("toggle-formula-btn").addEventListener("click", toggleFormulaHover);
