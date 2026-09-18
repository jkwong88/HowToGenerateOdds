#!/usr/bin/env node
// Bundles every page into ONE self-contained HTML file: an outer shell holds
// an <iframe>, and each page's fully-inlined HTML (from build.js's
// inlineAssets) is embedded as a srcdoc string the shell swaps in on
// navigation. A single iframe (rather than merging all pages' markup/JS into
// one document) means each page keeps running in its own global scope, so
// per-page globals (CATEGORY_CLASS, checkAllCells, etc., reused verbatim
// across many page-specific scripts) never collide.
const fs = require("fs");
const path = require("path");
const { inlineAssets, PAGES_DIR, DIST_DIR } = require("./build.js");

const OUT_FILE = path.join(DIST_DIR, "how-to-open-odds-single-file.html");
const START_PAGE = "introduction.html";

// The only internal navigation in the multi-page site is the exercise-index
// sidebar and the page-footer prev/next arrows (both plain <a href> links to
// sibling page files) - this replaces a click on either with a message to
// the parent shell, since those sibling files don't exist as real resources
// inside a single bundled file.
const NAV_INTERCEPT_SCRIPT = `
<script>
(function () {
  function intercept(root) {
    if (!root) return;
    root.querySelectorAll("a[href]").forEach(function (a) {
      a.addEventListener("click", function (event) {
        event.preventDefault();
        window.parent.postMessage({ type: "howtoopenodds-nav", page: a.getAttribute("href") }, "*");
      });
    });
  }
  intercept(document.getElementById("exercise-index-root"));
  intercept(document.getElementById("page-footer-root"));
})();
</script>
`;

// nav.js's currentPageFile() reads window.location.pathname, which inside a
// srcdoc iframe is "about:srcdoc" (no real per-page URL) - not this page's
// filename. That silently breaks currentPageIndex() (returns -1), which in
// turn breaks the prev/next arrows, the sidebar's "current page" highlight,
// and the Reset All button (page.type lookup fails, so nav.js never renders
// #reset-btn, and the page's own script then throws trying to wire it).
// Patching it to return the known filename at build time fixes all three.
function patchCurrentPageFile(html, file) {
  const pattern = /function currentPageFile\(\) \{[\s\S]*?\n\}/;
  if (!pattern.test(html)) {
    throw new Error(`currentPageFile() not found while patching ${file} - nav.js may have changed shape`);
  }
  return html.replace(pattern, `function currentPageFile() {\n  return ${JSON.stringify(file)};\n}`);
}

function buildPageHtml(file) {
  let html = inlineAssets(path.join(PAGES_DIR, file));
  html = patchCurrentPageFile(html, file);
  return html.replace("</body>", `${NAV_INTERCEPT_SCRIPT}\n</body>`);
}

function buildShell(pagesJson) {
  // </script> inside an embedded page's own <script> tags would otherwise
  // prematurely close *this* script block, since the HTML parser looks for
  // that literal sequence regardless of JS string context.
  const safeJson = JSON.stringify(pagesJson).replace(/<\/script/gi, "<\\/script");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>How To Open Odds</title>
<style>
  html, body { margin: 0; padding: 0; height: 100%; }
  iframe { width: 100%; height: 100vh; border: none; display: block; }
</style>
</head>
<body>
<iframe id="page-frame" title="How To Open Odds"></iframe>
<script>
  const PAGES = ${safeJson};
  const frame = document.getElementById("page-frame");

  function loadPage(name) {
    if (!PAGES[name]) return;
    frame.srcdoc = PAGES[name];
  }

  window.addEventListener("message", (event) => {
    if (event.data && event.data.type === "howtoopenodds-nav") loadPage(event.data.page);
  });

  loadPage(${JSON.stringify(START_PAGE)});
</script>
</body>
</html>
`;
}

function build() {
  const pageFiles = fs.readdirSync(PAGES_DIR).filter((f) => f.endsWith(".html"));
  const pagesJson = {};
  pageFiles.forEach((file) => {
    pagesJson[file] = buildPageHtml(file);
  });

  if (!fs.existsSync(DIST_DIR)) fs.mkdirSync(DIST_DIR);
  const shell = buildShell(pagesJson);
  fs.writeFileSync(OUT_FILE, shell);

  const sizeMb = (Buffer.byteLength(shell, "utf8") / (1024 * 1024)).toFixed(2);
  console.log(`Built ${path.relative(path.join(__dirname, ".."), OUT_FILE)} (${pageFiles.length} pages, ${sizeMb} MB)`);
}

build();
