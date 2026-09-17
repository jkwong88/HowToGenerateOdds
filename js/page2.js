function buildGivenTable(expected) {
  const header = document.getElementById("given-header");
  GOAL_VALUES.forEach((v) => {
    header.innerHTML += `<th>${v}</th>`;
  });

  const rows = [
    { key: "home", id: "given-home-row", map: expected.probHome },
    { key: "away", id: "given-away-row", map: expected.probAway },
    { key: "total", id: "given-total-row", map: expected.probTotal },
  ];

  rows.forEach(({ key, id, map }) => {
    const row = document.getElementById(id);
    GOAL_VALUES.forEach((v) => {
      row.innerHTML += `<td class="given-value" data-cell="given-${key}:${v}">${map[v].toFixed(1)}</td>`;
    });
  });
}

function isEdgeCell(r, c) {
  return r >= 3 || c >= 3;
}

function buildMatrixTable() {
  const header = document.getElementById("matrix-header");
  MATRIX_GOAL_VALUES.forEach((v) => {
    header.innerHTML += `<th>${v}</th>`;
  });

  const body = document.getElementById("matrix-body");
  MATRIX_GOAL_VALUES.forEach((r) => {
    const row = document.createElement("tr");
    let cells = `<td class="row-label">${r}</td>`;
    MATRIX_GOAL_VALUES.forEach((c) => {
      const disabledAttr = isEdgeCell(r, c) ? " disabled" : "";
      cells += `<td><input class="answer" type="number" step="0.01" id="matrix-${r}-${c}" data-formula="P(Home=${r}) &times; P(Away=${c})" data-refs="given-home:${r},given-away:${c}"${disabledAttr}></td>`;
    });
    row.innerHTML = cells;
    body.appendChild(row);
  });
}

// Goals 3+ carry little probability mass in this dataset and aren't the point
// of the exercise, so those cells stay hidden and disabled until the user
// solves the 3x3 core (Home <= 2, Away <= 2) or gives up via Show Answers.
function hideEdgeCells() {
  MATRIX_GOAL_VALUES.forEach((r) => {
    MATRIX_GOAL_VALUES.forEach((c) => {
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
  MATRIX_GOAL_VALUES.forEach((r) => {
    MATRIX_GOAL_VALUES.forEach((c) => {
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
  MATRIX_GOAL_VALUES.forEach((r) => {
    MATRIX_GOAL_VALUES.forEach((c) => {
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
  MATRIX_GOAL_VALUES.forEach((r) => {
    MATRIX_GOAL_VALUES.forEach((c) => {
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
  attachRefHighlight(input);
});

hideEdgeCells();

document.getElementById("check-matrix").addEventListener("click", () => checkMatrix(expected));
document.getElementById("fill-matrix").addEventListener("click", () => fillMatrix(expected));
document.getElementById("reset-btn").addEventListener("click", resetAll);
document.getElementById("toggle-formula-btn").addEventListener("click", toggleFormulaHover);
