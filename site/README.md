# Site

A one-page case study of the Toucan2: the Walid layout, the keymap layers, the firmware and the trainer. Built with the
Hallmark skill (theme Formwork); local only for now.

- `index.tmpl.html` + `build.mjs` → `index.html`. The six keyboard boards are drawn from `../trainer/keymap.js` (itself
  generated from the firmware keymap) and the eight annealing candidates from `../layout-optimizer/custom_free_v2.json`,
  so `node build.mjs` after a keymap change refreshes every label. The same build draws the method section's cost map
  (analyzer.py's effort formula, re-stated in JS) and the three finalists from `../layout-optimizer/custom_free_v2.json`.
- `styles.css` imports `tokens.css` and `base.css` (Hallmark scaffold). The first lines of `styles.css` are the design stamp.
- `images/screens/` are captures of the hosted trainer (dark theme, 2x).
- Serve: `python3 -m http.server 8777 --bind 127.0.0.1` here, then http://127.0.0.1:8777/
- Deploy: from the repository root, `node dist.mjs && npx wrangler@latest deploy` puts this page at https://toucan.walior.it/ and the trainer at `/trainer/` (one Worker, see `wrangler.toml` there)

- `images/screens/stats-*.png` are the trainer's Statistics drawer with the author's own progress (read from the browser's
  `toucan.*` localStorage on 2026-10-30, seeded into headless Chrome); the other captures run on a fresh profile.
- `data-anneal-seed5.json` is seed 5 of the final run, rerun with a trace (score, best, temperature every 100 swaps); it
  reproduces the Walid layout and its score exactly. The page draws it as the step 4 chart.
- Motion: one reveal on scroll (opacity and transform, 16px rise) on the blocks below the hero, and the chart draws
  itself on entry. Reduced motion, no scripting and automation (headless capture) all get the finished page.
