let oePhase = 1;

function isOddCell(home, away) {
  return (home + away) % 2 === 1;
}

function buildOEMatrixTable(expected) {
  const header = document.getElementById("oe-matrix-header");
  MATRIX_GOAL_VALUES.forEach((v) => {
    header.innerHTML += `<th>${v}</th>`;
  });

  const body = document.getElementById("oe-matrix-body");
  MATRIX_GOAL_VALUES.forEach((home) => {
    const row = document.createElement("tr");
    let cells = `<td class="row-label">${home}</td>`;
    MATRIX_GOAL_VALUES.forEach((away) => {
      const value = matrixExpected(expected, home, away).toFixed(2);
      cells += `<td><button type="button" class="oe-cell" id="oe-cell-${home}-${away}" data-cell="oe-cell:${home}-${away}">${value}</button></td>`;
    });
    row.innerHTML = cells;
    body.appendChild(row);
  });
}

// Clicking always paints with the current phase's color; if the cell already
// carries the other phase's color, the click replaces it instead of stacking.
function wireMatrixClicks() {
  MATRIX_GOAL_VALUES.forEach((home) => {
    MATRIX_GOAL_VALUES.forEach((away) => {
      const btn = document.getElementById(`oe-cell-${home}-${away}`);
      btn.addEventListener("click", () => {
        if (btn.disabled) return;
        btn.closest("td").classList.remove("cell-correct", "cell-wrong");
        const targetClass = oePhase === 1 ? "marked-odd" : "marked-even";
        const otherClass = oePhase === 1 ? "marked-even" : "marked-odd";
        if (btn.classList.contains(targetClass)) {
          btn.classList.remove(targetClass);
        } else {
          btn.classList.remove(otherClass);
          btn.classList.add(targetClass);
        }
      });
    });
  });
}

// Greys out both step instructions, then lights up whichever one is still
// actionable so the current step stands out.
function updateStepHighlight() {
  const step2Locked = document.getElementById("oe-step-2").classList.contains("locked");
  const step3Locked = document.getElementById("oe-step-3").classList.contains("locked");

  document.getElementById("step-note-1").classList.toggle("active", step2Locked);
  document.getElementById("step-note-2").classList.toggle("active", !step2Locked && step3Locked);
}

// Step 1's "Odds Complete" and step 2's "Even Complete" just move to the
// next step - neither checks anything.
function completeStep1() {
  oePhase = 2;
  unlockSection("oe-step-2");
  updateStepHighlight();
}

function completeStep2() {
  unlockSection("oe-step-3");
  updateStepHighlight();
}

// Step 3's "Check" is the only place the whole grid (both odd and even
// selections) actually gets verified.
function checkAllCells() {
  let allCorrect = true;

  MATRIX_GOAL_VALUES.forEach((home) => {
    MATRIX_GOAL_VALUES.forEach((away) => {
      const btn = document.getElementById(`oe-cell-${home}-${away}`);
      const cell = btn.closest("td");
      const shouldBeOdd = isOddCell(home, away);
      const isCorrect = shouldBeOdd
        ? btn.classList.contains("marked-odd")
        : btn.classList.contains("marked-even");
      cell.classList.toggle("cell-correct", isCorrect);
      cell.classList.toggle("cell-wrong", !isCorrect);
      if (!isCorrect) allCorrect = false;
    });
  });

  if (allCorrect) {
    MATRIX_GOAL_VALUES.forEach((home) => {
      MATRIX_GOAL_VALUES.forEach((away) => {
        document.getElementById(`oe-cell-${home}-${away}`).disabled = true;
      });
    });
    unlockSection("odds-section");
  }

  return allCorrect;
}

function fillAllCells() {
  MATRIX_GOAL_VALUES.forEach((home) => {
    MATRIX_GOAL_VALUES.forEach((away) => {
      const btn = document.getElementById(`oe-cell-${home}-${away}`);
      btn.classList.remove("marked-odd", "marked-even");
      btn.classList.add(isOddCell(home, away) ? "marked-odd" : "marked-even");
    });
  });
  checkAllCells();
}

function computeOEStats(expected) {
  let probOdd = 0;
  let probEven = 0;
  const oddRefs = [];
  const evenRefs = [];

  MATRIX_GOAL_VALUES.forEach((home) => {
    MATRIX_GOAL_VALUES.forEach((away) => {
      const prob = matrixExpected(expected, home, away);
      const ref = `oe-cell:${home}-${away}`;
      if (isOddCell(home, away)) {
        probOdd += prob;
        oddRefs.push(ref);
      } else {
        probEven += prob;
        evenRefs.push(ref);
      }
    });
  });

  return {
    odd: { prob: probOdd, refs: oddRefs.join(",") },
    even: { prob: probEven, refs: evenRefs.join(",") },
  };
}

// While hovering the Odd (or Even) probability formula, the matching cells
// already get the usual yellow ref-highlight; this additionally fades the
// *other* parity's cell text into its own background, so only the cells
// actually being summed stay legible.
function attachDimComplement(key, complementRefs) {
  const input = document.getElementById(`prob-${key}`);
  const cell = input.closest("td");

  function setDim(on) {
    complementRefs.split(",").forEach((ref) => {
      const trimmed = ref.trim();
      if (!trimmed) return;
      document.querySelectorAll(`[data-cell="${trimmed}"]`).forEach((el) => {
        el.classList.toggle("dim-text", on);
      });
    });
  }

  cell.addEventListener("mouseenter", () => {
    if (cell.dataset.tooltip && cell.dataset.tooltip === input.dataset.formula) setDim(true);
  });
  cell.addEventListener("mouseleave", () => setDim(false));
}

function buildOddsTable() {
  const body = document.getElementById("odds-table-body");
  const rows = [
    { key: "odd", label: "Odd", formula: "SUM(cells where Home+Away is odd)" },
    { key: "even", label: "Even", formula: "SUM(cells where Home+Away is even)" },
  ];

  rows.forEach(({ key, label, formula }) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td class="row-label">${label}</td>
      <td data-cell="prob-${key}-cell"><input class="answer" type="number" step="0.01" id="prob-${key}" data-formula="${formula}"></td>
      <td data-cell="euro-${key}-cell"><input class="answer" type="number" step="0.01" id="euro-${key}" data-formula="1 / Probability" data-refs="prob-${key}-cell"></td>
      <td data-cell="hk-${key}-cell"><input class="answer" type="number" step="0.01" id="hk-${key}" data-formula="Euro &minus; 1" data-refs="euro-${key}-cell"></td>
      <td><input class="answer" type="number" step="0.01" id="malay-${key}" data-formula="HK if HK &le; 1, else &minus;1 / HK" data-refs="hk-${key}-cell"></td>
    `;
    body.appendChild(row);
  });
}

function checkOddsTable(oeStats) {
  const results = [];

  ["odd", "even"].forEach((key) => {
    const prob = oeStats[key].prob;
    const euro = toEuro(prob);
    const hk = toHK(euro);
    const malay = toMalay(hk);
    results.push(markInput(document.getElementById(`prob-${key}`), prob, 0.005, 2));
    results.push(markInput(document.getElementById(`euro-${key}`), euro, 0.005, 2));
    results.push(markInput(document.getElementById(`hk-${key}`), hk, 0.005, 2));
    results.push(markInput(document.getElementById(`malay-${key}`), malay, 0.005, 2));
  });

  return results.every(Boolean);
}

function fillOddsTable(oeStats) {
  ["odd", "even"].forEach((key) => {
    const prob = oeStats[key].prob;
    const euro = toEuro(prob);
    const hk = toHK(euro);
    const malay = toMalay(hk);
    document.getElementById(`prob-${key}`).value = prob.toFixed(2);
    document.getElementById(`euro-${key}`).value = euro.toFixed(2);
    document.getElementById(`hk-${key}`).value = hk.toFixed(2);
    document.getElementById(`malay-${key}`).value = malay.toFixed(2);
  });
  checkOddsTable(oeStats);
}

function resetAll() {
  document.querySelectorAll("input.answer").forEach((input) => {
    input.value = "";
    syncEmptyTooltip(input);
  });

  MATRIX_GOAL_VALUES.forEach((home) => {
    MATRIX_GOAL_VALUES.forEach((away) => {
      const btn = document.getElementById(`oe-cell-${home}-${away}`);
      btn.classList.remove("marked-odd", "marked-even");
      btn.closest("td").classList.remove("cell-correct", "cell-wrong");
      btn.disabled = false;
    });
  });

  oePhase = 1;
  lockSection("oe-step-2");
  lockSection("oe-step-3");
  lockSection("odds-section");
  updateStepHighlight();
}

const expected = computeGoalStats();
const oeStats = computeOEStats(expected);

buildOEMatrixTable(expected);
wireMatrixClicks();
buildOddsTable();
attachDimComplement("odd", oeStats.even.refs);
attachDimComplement("even", oeStats.odd.refs);

document.querySelectorAll("input.answer").forEach((input) => {
  syncEmptyTooltip(input);
  input.addEventListener("input", () => syncEmptyTooltip(input));
  attachRefHighlight(input);
});

lockSection("oe-step-2");
lockSection("oe-step-3");
lockSection("odds-section");
updateStepHighlight();

document.getElementById("check-odd").addEventListener("click", completeStep1);
document.getElementById("check-even").addEventListener("click", completeStep2);
document.getElementById("check-oe").addEventListener("click", checkAllCells);
document.getElementById("reset-oe").addEventListener("click", resetAll);
document.getElementById("fill-oe").addEventListener("click", fillAllCells);
document.getElementById("check-odds-table").addEventListener("click", () => checkOddsTable(oeStats));
document.getElementById("fill-odds-table").addEventListener("click", () => fillOddsTable(oeStats));
document.getElementById("reset-btn").addEventListener("click", resetAll);
document.getElementById("toggle-formula-btn").addEventListener("click", toggleFormulaHover);
