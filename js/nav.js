// Shared page manifest driving the exercise index, prev/next navigation,
// and the page footer (Reset All only shows for "exercise" pages). Add new
// pages here (nested under a section, or top-level) as they are created.
// Every entry is itself a linked page; an entry with `pages` also has its
// own overview page, listed just before its sub-pages in `PAGES`.
const PAGE_SECTIONS = [
  { number: "1", file: "introduction.html", title: "Introduction", type: "explanation" },
  {
    number: "2",
    file: "generate-final-score-matrix.html",
    heading: "How To Generate Final Score Probability Matrix",
    type: "explanation",
    pages: [
      { number: "2.1", file: "historical-match-data.html", title: "Exercise 1", type: "exercise" },
      { number: "2.2", file: "final-score-probability-matrix.html", title: "Exercise 2", type: "exercise" },
    ],
  },
  {
    number: "3",
    file: "market-types-overview.html",
    heading: "Odds For Different Market Type",
    type: "explanation",
    pages: [
      { number: "3.1", file: "correct-score-odds.html", title: "Correct Score", type: "exercise" },
      { number: "3.2", file: "odd-even-market.html", title: "Odd / Even", type: "exercise" },
      { number: "3.3", file: "1x2-double-chance-market.html", title: "1X2 & Double Chance", type: "exercise" },
      { number: "3.4", file: "total-goal-market.html", title: "Total Goal", type: "exercise" },
      { number: "3.5", file: "over-under-market.html", title: "Over / Under", type: "exercise" },
      { number: "3.6", file: "hdp-market.html", title: "HDP", type: "exercise" },
    ],
  },
  {
    number: "4",
    file: "opening-market.html",
    heading: "Opening Market",
    type: "explanation",
    pages: [
      { number: "4.1", file: "opening-over-under-market.html", title: "Opening the Market", type: "exercise" },
      { number: "4.2", file: "adding-a-spread.html", title: "Adding a Spread", type: "exercise" },
    ],
  },
  { number: "5", file: "poisson-distribution.html", title: "Relationship between Poisson and Probability", type: "explanation" },
];

// Flattened list of linkable pages, in display order, used for prev/next
// navigation and for finding the current page. A section entry is itself
// linkable (its overview page) and precedes its sub-pages.
const PAGES = PAGE_SECTIONS.flatMap((entry) => (entry.pages ? [entry, ...entry.pages] : [entry]));

function currentPageFile() {
  return window.location.pathname.split("/").pop();
}

function currentPageIndex() {
  return PAGES.findIndex((page) => page.file === currentPageFile());
}

function renderExerciseIndex() {
  const root = document.getElementById("exercise-index-root");
  if (!root) return;

  const current = currentPageFile();
  const renderAnchor = (page, extraClass = "") => {
    const isCurrent = page.file === current;
    const separator = page.number.includes(".") ? "" : ".";
    const classes = [isCurrent ? "current" : "", extraClass].filter(Boolean).join(" ");
    const label = page.title || page.heading;
    return `<a href="${page.file}" class="${classes}">${page.number}${separator} ${label}</a>`;
  };

  const items = PAGE_SECTIONS.map((entry) => {
    if (!entry.pages) return `<li>${renderAnchor(entry, "index-top-level")}</li>`;
    const subItems = entry.pages.map((page) => `<li>${renderAnchor(page)}</li>`).join("");
    return `<li class="index-section">${renderAnchor(entry, "index-section-title")}<ul>${subItems}</ul></li>`;
  }).join("");

  root.innerHTML = `
    <button id="hint-toggle-btn">Hint: On</button>
    <nav>
      <ul id="exercise-index-list">${items}</ul>
    </nav>
  `;
}

function renderPageFooter() {
  const root = document.getElementById("page-footer-root");
  if (!root) return;

  const index = currentPageIndex();
  const page = PAGES[index];
  const prevFile = index > 0 ? PAGES[index - 1].file : null;
  const nextFile = index >= 0 && index < PAGES.length - 1 ? PAGES[index + 1].file : null;

  const resetButton = page && page.type === "exercise" ? '<button id="reset-btn">Reset All</button>' : "";

  root.innerHTML = `
    ${resetButton}
    <div class="page-nav" id="page-nav">
      <a class="page-nav-btn${prevFile ? "" : " disabled"}" href="${prevFile || "#"}" aria-label="Previous page">&#8592;</a>
      <a class="page-nav-btn${nextFile ? "" : " disabled"}" href="${nextFile || "#"}" aria-label="Next page">&#8594;</a>
    </div>
  `;
}

renderPageFooter();
renderExerciseIndex();
