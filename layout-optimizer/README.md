# Toucan2 custom layout optimizer (2026-10-19)

Spike-grade tooling that produced the custom letter layout for the Toucan2.

- `extract_corpus.py` — builds `corpus/local_{en,fr,dar}.txt` from ~/.claude history/transcripts and a claude.ai export unzipped into `./export/`. Corpus files are NOT committed here (private text); rerun to regenerate.
- `analyzer.py` — Toucan geometry (from toucan.dtsi), metrics (SFB, SFS, scissors, LSB, redirects, rolls, home row, finger load, effort), reference layouts (QWERTY, Colemak-DH, Graphite, Gallium, Canary, Sturdy, Ergo-L, Optimot).
- `optimize2.py` — simulated annealing with per-finger load caps. `TAG=_v2 python3 optimize2.py free 8 60000` reproduces the final run.
- `custom_free_v2.json` — the 8 ranked results of the final run. Final pick = the seed-5 layout (same family as seeds 0/1, vowels right):

```
  b w l d q   z o y , k
  c s n t v   . a e i h
  p g r m j   ' x - u f
```

Weighting used: 65% English, 33% French, 2% Darija (user corpus).
