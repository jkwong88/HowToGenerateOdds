# How Sportsbook Odds Are Derived - Session Transcript

Source deck: [slide-deck.html](slide-deck.html)
Demo file: `dist/how-to-open-odds-single-file.html`
Total budget: ~30 min (7 exercises x 3 min = 21 min, remainder for overview/recap/buffer)

---

## Page 1 / 17 - Welcome

Demo: Introduction
Time allocated: - (no timer)

Welcome everyone. This is a series of self-checking exercises that shows how raw match data gets turned into betting probabilities and odds, one market at a time. Today we'll go through four parts: first, how to generate a Final Score Probability Matrix; then odds for different market types; then how a market actually gets opened; and finally, how the Poisson distribution connects back to everything we've built. By the end of the session you'll be able to watch the same ten matches turn into score probabilities, market probabilities, and finally real quoted odds.

---

## Page 2 / 17 - Session Agenda

Demo: Page footer controls
Time allocated: - (no timer)

Before we dive in, a quick word on how we'll run this. We'll work through each exercise live, and every exercise gets its own three-minute timer — when it runs out, we'll pause, compare answers, and then move on. Whenever you see a Check button, or Check Classification, click it and you'll get instant feedback on whether a cell is right or wrong. And if you ever get stuck on a formula, look for the "Hint" button at the top of the page — toggle it on and hovering, or tabbing into, an empty cell will show you the formula behind it.

---

## Page 3 / 17 - Overview

Demo: How to Generate a Final Score Probability Matrix
Time allocated: - (no timer)

Here's what we're doing on this page: building the Final Score Probability Matrix, the Home-by-Away grid of scoreline probabilities everything else in this course will be priced from. Why does this matter? Because every market we look at later — Correct Score, Odd/Even, Over/Under, all of it — starts from this one matrix, so getting it right here keeps everything downstream correct. How do we build it? Two steps. Step one: count how often each goal value comes up for Home and for Away across our ten matches, and turn each count into a probability — goal count divided by number of matches. Step two: multiply those Home and Away probabilities together to get the joint probability of any scoreline — P(Home=h, Away=a) = P(Home=h) times P(Away=a) — assuming the two are independent.

---

## Page 4 / 17 - Exercise: Historical Match Data

Demo: Historical Match Data
Time allocated: 3 min (countdown timer on slide - Start / Stop / Reset)

Let's do this one together. Part 1 just shows you the raw ten-match history as given data. Part 2 asks you to build a goal-count frequency table for Home and Away — essentially a COUNTIF across the ten matches. Part 3 then converts those counts into probabilities. Each part only unlocks once you pass the Check on the one before it, so work top to bottom. I'll start the timer now — three minutes, go ahead.

---

## Page 5 / 17 - Exercise: Final Score Probability Matrix

Demo: Final Score Probability Matrix
Time allocated: 3 min (countdown timer on slide - Start / Stop / Reset)

Now the joint matrix. You've got the Home and Away probabilities as given data from the last exercise — your job is to fill in the three-by-three core of the matrix, Home up to 2 and Away up to 2, using P(Home=h, Away=a) = P(Home=h) times P(Away=a). Once that core checks out, the rest of the grid reveals itself automatically. Three minutes on the clock, let's go.

---

## Page 6 / 17 - Overview

Demo: Odds for Different Market Types
Time allocated: - (no timer)

Moving on to odds for different market types. Just now, we generated the Final Score Probability Matrix — the Home times Away scoreline probabilities from our ten-match history. Every market type in this section reuses that exact same matrix; we're not computing anything new from scratch, we just group and sum scorelines from it. Where a line can result in a push or a split settlement, we adjust that middle outcome's settlement value before we compute the final bettable probability. And every market shares the same conversion chain: Fair Probability to Euro Odds, Euro Odds to HK Odds, HK Odds to Malay Odds. We'll use this chain again and again for the rest of the session.

---

## Page 7 / 17 - Exercise: Correct Score

Demo: Correct Score
Time allocated: 3 min (countdown timer on slide - Start / Stop / Reset)

First market: Correct Score. How does it bet? Your bet only wins if the final score matches your exact pick — say 2:1 — so it's the narrowest market and carries the longest odds. You may or may not notice that the AOS odds show up as N/A — this is because a probability of exactly zero has no defined odds, since Euro Odds is 1 divided by Probability. AOS covers every scoreline outside our 5-by-5 grid, and in this dataset it lands at exactly 0.00 — not because those scores are impossible, just because none of our ten matches happened to land on one. For the exercise, fill in the Away equals 0 column, walking each scoreline through Fair Probability, Euro, HK, and Malay Odds. Three minutes, starting now — once you're done, I'll share that later, when we get to Poisson, we'll see how it assigns AOS a small, non-zero probability instead of a flat zero.

---

## Page 8 / 17 - Exercise: Odd / Even

Demo: Odd / Even
Time allocated: 3 min (countdown timer on slide - Start / Stop / Reset)

Next, Odd/Even. How does it bet? It only cares about whether the total number of goals in the match is odd or even — nothing else about the scoreline matters. Pick a category, Odd or Even, and then click matrix cells to paint them; you can switch categories and repaint any cell at any time. When you're done, hit Check Classification and it grades the whole grid at once, marking every cell right or wrong. Get it right and it unlocks the Odd/Even Fair Odds table — remember to fill that table in too, not just the classification. Three minutes, go ahead.

---

## Page 9 / 17 - Exercise: Over / Under

Demo: Over / Under (Line 2.5)
Time allocated: 3 min (countdown timer on slide - Start / Stop / Reset)

Now Over/Under. How does it bet? It wins based on whether total goals finish over or under a set line. We'll do this in two passes. First, at Line 2.5 — a half-point line, so there's no possibility of a push, you'll only ever classify cells as Under or Over. Then switch the Line dropdown to 2 — a whole-number line — and redo the classification; now there's a real, refundable Push category for scorelines that land exactly on the line. Either way, you'll build the Raw Outcome Probability table first, then convert that into the Settlement-Adjusted Selection Probability table. One thing to note: odds are only graded at the default line of 2.5 — every other line, including 2, just shows odds as given values. Three minutes on the clock — try both lines if you have time.

---

## Page 10 / 17 - Overview

Demo: Opening Market
Time allocated: - (no timer)

Now let's talk about Opening the Market. A fair market can technically be built for any line, but a real bookmaker only ever quotes a small number of them. First we pick the candidate main line, or lines, whose fair probability lands closest to a 50/50 split. Then we take that chosen line and shave a pricing spread off its fair Malay odds, which is how a fair market becomes an actual quoted one, complete with the bookmaker's margin baked in.

---

## Page 11 / 17 - Exercise: Opening the Market

Demo: Opening the Market
Time allocated: 3 min (countdown timer on slide - Start / Stop / Reset)

Let's try this one. First, set Market Type to Over/Under. Then work through the Number of Candidate Main Lines dropdown: try 1 line, then 2 lines, then 3 lines, and watch which lines get selected each time. The rule driving the selection is always the same — whichever line, or lines, sit closest to a 50/50 fair split get picked. Three minutes to explore all three settings.

---

## Page 12 / 17 - Exercise: Adding a Pricing Spread

Demo: Adding a Pricing Spread
Time allocated: 3 min (countdown timer on slide - Start / Stop / Reset)

Now adding a pricing spread. The main line is fixed here at Over/Under 2.75, with a pricing spread of 0.10 applied to the fair Malay odds, half off each side. Fill in the Probability, Euro, HK, and Malay Odds for that spread row. When you're done, notice that the two sides' implied probabilities now sum to slightly more than 100 percent — that extra bit is the overround, and it's exactly how the bookmaker's margin shows up in the numbers. Three minutes, go ahead.

---

## Page 13 / 17 - Recap on the Odds Board

Demo: Introduction (odds board image)
Time allocated: - (no timer)

Let's go back to the odds board image from the Introduction page. Today we covered Correct Score, Odd/Even, Over/Under at both line 2.5 and line 2, and how the Opening Market picks and prices a line. What we didn't get to today — 1X2, Double Chance, Total Goals, and HDP — are all built the same way, using the same matrix and the same conversion chain, so I'd encourage you to go back and work through those on your own. Two things aren't covered anywhere in this course at all: First Half markets, and live, in-play odds decay.

---

## Page 14 / 17 - Historical Probability and Poisson, Part 1

Demo: From Historical Probability to Poisson - intro & limitation
Time allocated: - (no timer)

Let's close with the Poisson section. First, a recap: everything we've done so far uses the same rule, probability equals count divided by number of matches — that's called Historical, or Empirical, Probability. Next, the limitation: with only ten matches, some goal counts simply never occurred, so they show up as a flat 0% — this is the same issue we saw earlier with Any Other Score in Correct Score, where the odds showed N/A because the probability was exactly zero. That doesn't mean they're impossible, it just means our sample never happened to include one. Then we introduce Poisson as a different way to ask the question — instead of "how often did this happen," it asks "given the expected scoring rate, how likely is each possible number of goals."

---

## Page 15 / 17 - The Poisson Formula and Comparison

Demo: From Historical Probability to Poisson - formula & comparison
Time allocated: - (no timer)

Here's the Poisson formula: P(X=k) equals e to the minus lambda, times lambda to the k, divided by k factorial. Let's break down what each symbol means. P(X=k) is the probability of scoring exactly k goals. k is the number of goals. Lambda is the mean scoring rate — the expected average number of goals per match, calculated here as total goals scored divided by ten matches, separately for Home and for Away. e is just a mathematical constant, about 2.71828. And k factorial means k times k minus 1 times k minus 2, all the way down to 1. This formula assumes a fixed scoring rate and that Home and Away goals are independent, the same independence assumption we already used earlier. Then we put Historical and Poisson probabilities side by side in one table so you can see exactly where they agree and where they diverge — that table is right here on the slide, computed from the same ten matches, so point to it directly instead of describing the numbers out loud. Two things to call out on it: first, the Historical column has no entry for 5 or 6 goals — it shows a flat 0%, because those goal counts never came up in our ten matches — while the Poisson column still assigns them a small, non-zero probability. Second, for the goal counts we did observe, the Poisson probabilities land quite close to the Historical ones, which is exactly why Poisson works as a smoother stand-in for the same underlying pattern.

---

## Page 16 / 17 - Back to the Matrix, and Poisson's Limits

Demo: From Historical Probability to Poisson - back to the matrix & limits
Time allocated: - (no timer)

This makes the closing point: Poisson only changes how we estimate the Home and Away goal probabilities — everything downstream, the matrix, the market, the odds conversion, is exactly the same pipeline we used all session. We even walk through one worked example, multiplying a Poisson-estimated P(Home=1) by P(Away=0) using that same independence formula. One important limit to flag: Poisson smooths out gaps and can assign probability to outcomes we never observed, but it doesn't know anything about team strength, form, injuries, or tactics — it's a probability distribution, not a prediction engine.

---

## Page 17 / 17 - Thank You

Demo: - (closing slide)
Time allocated: - (no timer)

That's everything I wanted to cover today. Same file, same dataset, one continuous pipeline from raw match data all the way to quoted odds. If you want more practice, the markets we didn't get to live — 1X2, Double Chance, Total Goals, and HDP — are built the exact same way, so work through those on your own whenever you like. Thanks for joining, and I'm happy to take questions now, or you can reach out any time after.
