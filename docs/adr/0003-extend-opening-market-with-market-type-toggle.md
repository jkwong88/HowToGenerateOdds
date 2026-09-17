# Extend 4.1/4.2 with a market-type toggle instead of separate Handicap pages

4.1 (Opening the Market) and 4.2 (Adding a Spread) both gained an Over/Under-vs-Handicap toggle in place, rather than a separate pair of Handicap-specific pages. The "find the fairest line" and "shift the price by a spread" mechanics are identical regardless of which axis (sum or difference) they sweep — only the underlying probability computation swaps. Duplicating the pages would have meant duplicating that mechanic, not the market-specific math.
