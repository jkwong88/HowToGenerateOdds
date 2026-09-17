#!/usr/bin/env node
// Bundles each page's linked CSS/JS into one self-contained HTML file under dist/,
// so a single file can be shared without the css/ and js/ folders.
const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.join(__dirname, "..");
const PAGES_DIR = path.join(ROOT_DIR, "pages");
const DIST_DIR = path.join(ROOT_DIR, "dist");

const IMAGE_MIME_TYPES = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif", ".svg": "image/svg+xml" };

function inlineAssets(htmlPath) {
  const dir = path.dirname(htmlPath);
  let html = fs.readFileSync(htmlPath, "utf8");

  html = html.replace(/<link\s+rel="stylesheet"\s+href="([^"]+)">/g, (_match, href) => {
    const css = fs.readFileSync(path.join(dir, href), "utf8");
    return `<style>\n${css}\n</style>`;
  });

  html = html.replace(/<script\s+src="([^"]+)"><\/script>/g, (_match, src) => {
    const js = fs.readFileSync(path.join(dir, src), "utf8");
    return `<script>\n${js}\n</script>`;
  });

  return html;
}

function build() {
  if (!fs.existsSync(DIST_DIR)) fs.mkdirSync(DIST_DIR);
  const pages = fs.readdirSync(PAGES_DIR).filter((f) => f.endsWith(".html"));
  pages.forEach((file) => {
    const bundled = inlineAssets(path.join(PAGES_DIR, file));
    fs.writeFileSync(path.join(DIST_DIR, file), bundled);
    console.log(`Built dist/${file}`);
  });
}

build();
