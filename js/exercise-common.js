// Shared exercise mechanics (tooltips, hint toggle, answer checking,
// section locking) reused by every exercise page.
const HINT_STORAGE_KEY = "hintOn";

function readStoredHint() {
  try {
    return localStorage.getItem(HINT_STORAGE_KEY) !== "false";
  } catch {
    return true;
  }
}

let hintOn = readStoredHint();

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
  setCellTooltip(input, input.value.trim() === "" && hintOn ? input.dataset.formula : "");
}

function refreshFormulaTooltips() {
  document.querySelectorAll("input.answer").forEach((input) => {
    if (input.value.trim() === "") {
      setCellTooltip(input, hintOn ? input.dataset.formula : "");
    }
  });
}

function updateHintButtonLabel() {
  const btn = document.getElementById("hint-toggle-btn");
  if (btn) btn.textContent = `Hint: ${hintOn ? "On" : "Off"}`;
}

function toggleHint() {
  hintOn = !hintOn;
  try {
    localStorage.setItem(HINT_STORAGE_KEY, String(hintOn));
  } catch {
    // Storage may be unavailable (e.g. private browsing); the toggle still
    // works for the current page, it just won't persist across navigation.
  }
  updateHintButtonLabel();
  refreshFormulaTooltips();
}

// tolerance/decimals are required, not defaulted - every call site must
// state the precision policy it's checking against (see README), so a
// display change and its validation can never silently drift apart.
function markInput(input, expected, tolerance, decimals) {
  const isEmpty = input.value.trim() === "";
  const value = parseFloat(input.value);
  const isCorrect = !isEmpty && Math.abs(value - expected) <= tolerance;

  input.classList.remove("correct", "incorrect");
  input.classList.add(isCorrect ? "correct" : "incorrect");

  if (isEmpty) {
    setCellTooltip(input, hintOn ? input.dataset.formula : "");
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

// Mirrors the hover trigger on `focus`/`blur` too (not just `mouseenter`/
// `mouseleave`), so tabbing to an empty input highlights its source cells
// the same way pointing at it does - keyboard users get the same
// cross-cell feedback as mouse users, not a degraded version of it.
function attachRefHighlight(input) {
  const refs = input.dataset.refs;
  if (!refs) return;
  const cell = input.closest("td");

  const show = () => {
    if (cell.dataset.tooltip && cell.dataset.tooltip === input.dataset.formula) {
      setRefHighlight(refs, true);
    }
  };
  const hide = () => setRefHighlight(refs, false);

  cell.addEventListener("mouseenter", show);
  cell.addEventListener("mouseleave", hide);
  input.addEventListener("focus", show);
  input.addEventListener("blur", hide);
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

// Builds a Home x Away click-to-paint matrix and returns helpers to
// wire/check/fill/reset it - shared by every exercise that classifies
// scorelines into categories (Odd/Even, 1X2, Total Goal, Over/Under, HDP).
// `idPrefix` namespaces this matrix's cell ids/data-cell refs so more than
// one can exist on a page; `categoryClass` maps a category key (as returned
// by the `classify` passed to checkAll/fillAll/computeStats) to a CSS class.
function createMatrixClassifier({ idPrefix, expected, categoryClass }) {
  const cells = {};

  const header = document.getElementById(`${idPrefix}-matrix-header`);
  header.innerHTML += MATRIX_GOAL_VALUES.map((v) => `<th>${v}</th>`).join("");

  const body = document.getElementById(`${idPrefix}-matrix-body`);
  MATRIX_GOAL_VALUES.forEach((home) => {
    const row = document.createElement("tr");
    const rowCells = MATRIX_GOAL_VALUES.map((away) => {
      const value = matrixExpected(expected, home, away).toFixed(2);
      return `<td><button type="button" class="oe-cell" id="${idPrefix}-cell-${home}-${away}" data-cell="${idPrefix}-cell:${home}-${away}">${value}</button></td>`;
    }).join("");
    row.innerHTML = `<td class="row-label">${home}</td>${rowCells}`;
    body.appendChild(row);
  });

  MATRIX_GOAL_VALUES.forEach((home) => {
    MATRIX_GOAL_VALUES.forEach((away) => {
      cells[`${home}-${away}`] = document.getElementById(`${idPrefix}-cell-${home}-${away}`);
    });
  });

  // Clicking always paints with the current phase's color; if the cell
  // already carries a different phase's color, the click replaces it
  // instead of stacking. `getCurrentClass` is read live on every click, so
  // it can reflect a page's current phase and/or point/line selection.
  function wireClicks(getCurrentClass) {
    MATRIX_GOAL_VALUES.forEach((home) => {
      MATRIX_GOAL_VALUES.forEach((away) => {
        const btn = cells[`${home}-${away}`];
        btn.addEventListener("click", () => {
          if (btn.disabled) return;
          btn.closest("td").classList.remove("cell-correct", "cell-wrong");
          const targetClass = getCurrentClass();
          if (btn.classList.contains(targetClass)) {
            btn.classList.remove(targetClass);
          } else {
            Object.values(categoryClass).forEach((c) => btn.classList.remove(c));
            btn.classList.add(targetClass);
          }
        });
      });
    });
  }

  function checkAll(classify) {
    let allCorrect = true;

    MATRIX_GOAL_VALUES.forEach((home) => {
      MATRIX_GOAL_VALUES.forEach((away) => {
        const btn = cells[`${home}-${away}`];
        const cell = btn.closest("td");
        const correctClass = categoryClass[classify(home, away)];
        const isCorrect = btn.classList.contains(correctClass);
        cell.classList.toggle("cell-correct", isCorrect);
        cell.classList.toggle("cell-wrong", !isCorrect);
        if (!isCorrect) allCorrect = false;
      });
    });

    if (allCorrect) {
      MATRIX_GOAL_VALUES.forEach((home) => {
        MATRIX_GOAL_VALUES.forEach((away) => {
          cells[`${home}-${away}`].disabled = true;
        });
      });
    }

    return allCorrect;
  }

  function fillAll(classify) {
    MATRIX_GOAL_VALUES.forEach((home) => {
      MATRIX_GOAL_VALUES.forEach((away) => {
        const btn = cells[`${home}-${away}`];
        Object.values(categoryClass).forEach((c) => btn.classList.remove(c));
        btn.classList.add(categoryClass[classify(home, away)]);
      });
    });
  }

  function reset() {
    MATRIX_GOAL_VALUES.forEach((home) => {
      MATRIX_GOAL_VALUES.forEach((away) => {
        const btn = cells[`${home}-${away}`];
        Object.values(categoryClass).forEach((c) => btn.classList.remove(c));
        btn.closest("td").classList.remove("cell-correct", "cell-wrong");
        btn.disabled = false;
      });
    });
  }

  // Sums matrixExpected probability per category (via `classify`), and
  // records which cell ids feed each one, for attachDimComplement / formula
  // cross-highlighting.
  function computeStats(classify, categories) {
    const stats = {};
    categories.forEach((cat) => {
      stats[cat] = { prob: 0, refs: [] };
    });

    MATRIX_GOAL_VALUES.forEach((home) => {
      MATRIX_GOAL_VALUES.forEach((away) => {
        const cat = classify(home, away);
        stats[cat].prob += matrixExpected(expected, home, away);
        stats[cat].refs.push(`${idPrefix}-cell:${home}-${away}`);
      });
    });

    categories.forEach((cat) => {
      stats[cat].refs = stats[cat].refs.join(",");
    });
    return stats;
  }

  return { wireClicks, checkAll, fillAll, reset, computeStats };
}

// Builds a free-selection category button group (a "paint mode" picker) -
// shared by every matrix-classification exercise (Odd/Even, 1X2, Total
// Goal, Over/Under, HDP) so a student can switch which category they're
// painting at any time, instead of being forced through a one-way
// Step 1 -> Step 2 -> ... sequence that couldn't be corrected once
// advanced past. `categories`/`labels` can change later via `rebuild`
// (Over/Under and HDP swap between 2 and 3 categories, and relabel the
// middle one, depending on the selected point/line).
// `descriptions` is optional: when given, each button also shows the
// category's defining rule (e.g. "Home > Away") as a second line, turning
// the button into a small card instead of a plain label - the CSS is the
// same either way (unselected = grey, selected = that category's color).
function createCategoryPicker({ containerId, categories, categoryClass, labels, descriptions }) {
  const container = document.getElementById(containerId);
  let active;

  function renderButton(cat) {
    const desc = descriptions && descriptions[cat];
    const inner = desc
      ? `<span class="cat-btn-label">${labels[cat]}</span><span class="cat-btn-desc">${desc}</span>`
      : labels[cat];
    return `<button type="button" class="cat-btn${desc ? " cat-btn-card" : ""} ${categoryClass[cat]}" data-category="${cat}" aria-pressed="${cat === active}">${inner}</button>`;
  }

  function render() {
    active = categories[0];
    container.innerHTML = categories.map(renderButton).join("");
    container.querySelectorAll(".cat-btn").forEach((btn) => {
      btn.addEventListener("click", () => setActive(btn.dataset.category));
    });
  }

  function setActive(cat) {
    active = cat;
    container.querySelectorAll(".cat-btn").forEach((btn) => {
      btn.setAttribute("aria-pressed", String(btn.dataset.category === active));
    });
  }

  function getActive() {
    return active;
  }

  function rebuild(newCategories, newLabels, newDescriptions) {
    categories = newCategories;
    descriptions = newDescriptions;
    labels = newLabels;
    render();
  }

  render();
  return { getActive, setActive, reset: () => setActive(categories[0]), rebuild };
}

// While hovering a probability formula cell for category `key`, fade the
// *other* categories' matrix cells into their own background so only the
// cells actually being summed stay legible. `getStats`/`getCategories` are
// called live (not just once), so this keeps working after a stats rebuild
// (e.g. a dropdown/point change).
function attachDimComplement(inputId, key, getStats, getCategories) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const cell = input.closest("td");

  function setDim(on) {
    const stats = getStats();
    getCategories()
      .filter((k) => k !== key)
      .forEach((k) => {
        if (!stats[k]) return;
        stats[k].refs.split(",").forEach((ref) => {
          const trimmed = ref.trim();
          if (!trimmed) return;
          document.querySelectorAll(`[data-cell="${trimmed}"]`).forEach((el) => {
            el.classList.toggle("dim-text", on);
          });
        });
      });
  }

  const show = () => {
    if (cell.dataset.tooltip && cell.dataset.tooltip === input.dataset.formula) setDim(true);
  };
  const hide = () => setDim(false);

  cell.addEventListener("mouseenter", show);
  cell.addEventListener("mouseleave", hide);
  input.addEventListener("focus", show);
  input.addEventListener("blur", hide);
}

// Builds/checks/fills a straightforward Probability -> Euro -> HK -> Malay
// odds table with one row per category and no push/half-win exclusion -
// shared by Odd/Even, 1X2, and Total Goal. Over/Under and HDP need the
// push-aware True-Probability + BetTeam table instead, so they build their
// own (see over-under-market.js/hdp-market.js).
// `euroMode` (default "input"): "input" makes Euro Odds an editable,
// graded field; "given" makes it a derived `.given-value` cell that's
// revealed (not graded) once Probability checks out - the same role
// Double Chance's own Euro Odds column already plays, used here by 1X2's
// win/loss table since Euro Odds isn't graded there either; "omit" drops
// it entirely, since odds conversion isn't Total Goal's focus (Correct
// Score, Odd/Even, and 1X2 already drill it).
// `includeHkMalay` defaults to true (Odd/Even's shape) and only applies
// when `euroMode` is "input"; 1X2 and Double Chance don't need it, since
// those markets only ever show Euro Odds.
function buildSimpleOddsTable({ bodyId, categories, labels, formulaFor, euroMode = "input", includeHkMalay = true }) {
  const body = document.getElementById(bodyId);
  categories.forEach((key) => {
    const row = document.createElement("tr");
    let cells = `
      <td class="row-label">${labels[key]}</td>
      <td data-cell="prob-${key}-cell"><input class="answer" type="number" step="0.01" id="prob-${key}" data-formula="${formulaFor(key)}"></td>
    `;
    if (euroMode === "given") {
      cells += `<td class="given-value" id="euro-${key}">&mdash;</td>`;
    } else if (euroMode === "input") {
      cells += `<td data-cell="euro-${key}-cell"><input class="answer" type="number" step="0.01" id="euro-${key}" data-formula="1 / Probability" data-refs="prob-${key}-cell"></td>`;

      if (includeHkMalay) {
        cells += `
          <td data-cell="hk-${key}-cell"><input class="answer" type="number" step="0.01" id="hk-${key}" data-formula="Euro &minus; 1" data-refs="euro-${key}-cell"></td>
          <td><input class="answer" type="number" step="0.01" id="malay-${key}" data-formula="HK if HK &le; 1, else &minus;1 / HK" data-refs="hk-${key}-cell"></td>
        `;
      }
    }
    row.innerHTML = cells;
    body.appendChild(row);
  });
}

function checkSimpleOddsTable(categories, stats, euroMode = "input", includeHkMalay = true) {
  const results = categories.map((key) => markInput(document.getElementById(`prob-${key}`), stats[key].prob, 0.005, 2));

  if (euroMode === "given") {
    if (results.every(Boolean)) {
      categories.forEach((key) => {
        const prob = stats[key].prob;
        document.getElementById(`euro-${key}`).textContent = isUndefinedOdds(prob) ? "N/A" : toEuro(prob).toFixed(2);
      });
    }
  } else if (euroMode === "input") {
    categories.forEach((key) => {
      const prob = stats[key].prob;
      if (!isUndefinedOdds(prob)) {
        const euro = toEuro(prob);
        results.push(markInput(document.getElementById(`euro-${key}`), euro, 0.005, 2));

        if (includeHkMalay) {
          const hk = toHK(euro);
          const malay = toMalay(hk);
          results.push(markInput(document.getElementById(`hk-${key}`), hk, 0.005, 2));
          results.push(markInput(document.getElementById(`malay-${key}`), malay, 0.005, 2));
        }
      }
    });
  }

  return results.every(Boolean);
}

function fillSimpleOddsTable(categories, stats, euroMode = "input", includeHkMalay = true) {
  categories.forEach((key) => {
    document.getElementById(`prob-${key}`).value = stats[key].prob.toFixed(2);
  });

  if (euroMode === "input") {
    categories.forEach((key) => {
      const prob = stats[key].prob;
      if (!isUndefinedOdds(prob)) {
        const euro = toEuro(prob);
        document.getElementById(`euro-${key}`).value = euro.toFixed(2);

        if (includeHkMalay) {
          const hk = toHK(euro);
          const malay = toMalay(hk);
          document.getElementById(`hk-${key}`).value = hk.toFixed(2);
          document.getElementById(`malay-${key}`).value = malay.toFixed(2);
        }
      }
    });
  }
  checkSimpleOddsTable(categories, stats, euroMode, includeHkMalay);
}

// Resets a "given" Euro Odds column back to its unrevealed placeholder -
// input.answer cells are already handled by each page's generic
// `input.answer` reset loop, but a `.given-value` cell isn't an input, so
// it needs its own reset call (mirrors Double Chance's resetDCDisplay).
function resetSimpleOddsTable(categories, euroMode) {
  if (euroMode !== "given") return;
  categories.forEach((key) => {
    document.getElementById(`euro-${key}`).textContent = "—";
  });
}

updateHintButtonLabel();
// Delegated so this works regardless of script order relative to nav.js,
// which creates #hint-toggle-btn at runtime.
document.addEventListener("click", (event) => {
  if (event.target.id === "hint-toggle-btn") toggleHint();
});
