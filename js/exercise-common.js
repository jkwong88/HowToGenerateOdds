// Shared exercise mechanics (tooltips, formula-hover toggle, answer checking,
// section locking) reused by every exercise page.
const DEFAULT_TOLERANCE = 0.05;
let formulaHoverOn = true;

function setCellTooltip(input, text) {
  const cell = input.closest("td");
  if (text) {
    cell.classList.add("has-tooltip");
    cell.dataset.tooltip = text;
  } else {
    cell.classList.remove("has-tooltip");
    delete cell.dataset.tooltip;
  }
}

function syncEmptyTooltip(input) {
  input.classList.remove("correct", "incorrect");
  setCellTooltip(input, input.value.trim() === "" && formulaHoverOn ? input.dataset.formula : "");
}

function refreshFormulaTooltips() {
  document.querySelectorAll("input.answer").forEach((input) => {
    if (input.value.trim() === "") {
      setCellTooltip(input, formulaHoverOn ? input.dataset.formula : "");
    }
  });
}

function toggleFormulaHover() {
  formulaHoverOn = !formulaHoverOn;
  document.getElementById("toggle-formula-btn").textContent = `Formula Hover: ${formulaHoverOn ? "On" : "Off"}`;
  refreshFormulaTooltips();
}

function markInput(input, expected, tolerance = DEFAULT_TOLERANCE, decimals = 1) {
  const isEmpty = input.value.trim() === "";
  const value = parseFloat(input.value);
  const isCorrect = !isEmpty && Math.abs(value - expected) <= tolerance;

  input.classList.remove("correct", "incorrect");
  input.classList.add(isCorrect ? "correct" : "incorrect");

  if (isEmpty) {
    setCellTooltip(input, formulaHoverOn ? input.dataset.formula : "");
  } else if (isCorrect) {
    setCellTooltip(input, "");
  } else {
    setCellTooltip(input, `Answer: ${expected.toFixed(decimals)}`);
  }

  return isCorrect;
}

function lockSection(sectionId) {
  const section = document.getElementById(sectionId);
  section.classList.add("locked");
  section.querySelectorAll("input.answer, button").forEach((el) => {
    el.disabled = true;
  });
}

function unlockSection(sectionId) {
  const section = document.getElementById(sectionId);
  section.classList.remove("locked");
  section.querySelectorAll("input.answer, button").forEach((el) => {
    el.disabled = false;
  });
}
