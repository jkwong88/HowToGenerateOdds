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

// Highlights the source cell(s) a formula reads from, e.g. hovering a matrix
// cell's formula highlights the given-table cells it multiplies together.
// Targets are matched via data-cell, which may tag more than one element
// (e.g. every historical row where Home == 0), so all of them light up.
function setRefHighlight(refs, on) {
  refs.split(",").forEach((ref) => {
    const key = ref.trim();
    if (!key) return;
    document.querySelectorAll(`[data-cell="${key}"]`).forEach((el) => {
      el.classList.toggle("ref-highlight", on);
    });
  });
}

function attachRefHighlight(input) {
  const refs = input.dataset.refs;
  if (!refs) return;
  const cell = input.closest("td");

  cell.addEventListener("mouseenter", () => {
    if (cell.dataset.tooltip && cell.dataset.tooltip === input.dataset.formula) {
      setRefHighlight(refs, true);
    }
  });
  cell.addEventListener("mouseleave", () => setRefHighlight(refs, false));
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
