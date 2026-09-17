# HowToOpenOdds

A set of static, standalone practice exercises for learning how betting odds and probabilities are derived from match data.

## Language

**Hint**:
A site-wide on/off toggle that controls whether empty answer cells reveal their formula on hover. Persisted across page loads via `localStorage` so it stays consistent as the learner moves between exercises.
_Avoid_: Formula Hover, formula hover

**Formula Card**:
A static reference panel, shown in the right-hand column of every page, listing the standard math formulas relevant to that page's content. Always visible regardless of the Hint toggle state — it is reference material, not a spoiler-style aid. May be empty for a page with no relevant formulas.
_Avoid_: formula tooltip (that term refers to the separate per-cell hover popup)

**Exercise Index**:
The persistent left-hand column, present on every page, listing all pages and linking to them. Distinct from the standalone `index.html` landing page, which remains a separate simple entry point.

**Page Shell**:
The three-column layout — Exercise Index on the left, a page's main content in the middle, Formula Card on the right — shared by every page regardless of its type.
_Avoid_: app shell, layout, template

**Exercise Page**:
A page presenting a gradable, self-checking activity: interactive inputs, a Check/Show Answers flow, and a Reset All control in its footer.
_Avoid_: exercise (ambiguous with the numbered exercise concept itself)

**Explanation Page**:
A read-only page presenting teaching content, with no gradable inputs and no Reset All control (e.g. Introduction). May or may not have a page-specific script.
_Avoid_: static page, content page

**Covers** (HDP):
Whether a side wins its Handicap bet at a given line — "Home Covers" / "Away Covers" — as opposed to Over/Under's "Under"/"Over", since HDP's axis (Home − Away) is signed and asymmetric rather than a plain total.
_Avoid_: wins, beats the spread
