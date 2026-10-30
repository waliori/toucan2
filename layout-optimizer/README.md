# Walid layout optimizer (2026-10-19)

Spike-grade tooling that produced the Walid layout (WLD) for the Toucan2. In one sentence: take a large sample of my own writing, give every arrangement of the 30 letters a score that says how comfortable it is to type that sample, and search for the arrangement with the lowest score. The site https://toucan.walior.it/#method walks through the five steps with the numbers.

- `extract_corpus.py` — builds `corpus/local_{en,fr,dar}.txt` from ~/.claude history/transcripts and a claude.ai export unzipped into `./export/`. Corpus files are NOT committed here (private text); rerun to regenerate.
- `analyzer.py` — the Toucan2 key positions (from beekeeb's toucan.dtsi), the habits it counts in a text for a given layout, and the reference layouts it compares against (QWERTY, Colemak-DH, Graphite, Gallium, Canary, Sturdy, Ergo-L, Optimot). Each habit is a share: of every 100 letter pairs (or triples) in the text, how many do this?
  - SFB, same-finger bigram: two letters in a row typed with the same finger (slow).
  - SFS, same-finger skipgram: the same finger twice with one letter between.
  - scissors: two neighbouring fingers, one on the top row and one on the bottom row.
  - LSB, lateral stretch bigram: a pair where the index finger reaches to the inner column.
  - redirects: three letters on one hand where the direction changes (left-right-left), worse when no index finger is involved.
  - rolls: two letters in a row on one hand with different fingers, walking inward (towards the thumb) or outward; these feel good, so they count as a reward.
  - home row: the share of keystrokes on the eight resting keys (higher is better).
  - finger load: the share of keystrokes each finger takes, and left hand versus right.
  - effort (travel): a cost per key, 1 for a home key, 1 plus the distance to the finger's home key times a penalty for weak fingers (1.6 pinky, 1.2 ring, 1.3 for the inner index columns), averaged over all keystrokes.
- `optimize2.py` — the search. The score of a layout is the sum of the habits above, each share × its weight × 100 (same-finger bigrams weigh 3, skipgrams 0.8, scissors 1.5, stretches 1, redirects 1.2 plus 2 when no index finger helps, rolls −0.12 inward and −0.05 outward), plus travel × 8, plus penalties when the pinkies take more than 13% of keystrokes, when one hand takes more than half, and when any finger goes over its cap (8% pinky, 11.5% ring, 17% middle, 19% index). Lower is better; Walid scores 25.54 on my text, QWERTY 79.45. Simulated annealing then starts from a random board and swaps two letters 60,000 times: a swap that lowers the score is kept, one that raises it is kept with a probability that shrinks as the run "cools", so the search can leave a dead end early and settles late. `TAG=_v2 python3 optimize2.py free 8 60000` reproduces the final run: 8 random starts (seeds 0 to 7), 60,000 swaps each.
- `custom_free_v2.json` — the 8 results of the final run, best first. Three of them finished within 0.005 points of each other, which says the search converged. Final pick = the seed-5 layout (seed 1 is its mirror image, seed 0 differs by a few keys and puts the rarer r on a home key instead of n):

```
  b w l d q   z o y , k
  c s n t v   . a e i h
  p g r m j   ' x - u f
```

Language mix: of every 100 characters scored, 65 are English, 33 French, 2 Darija. The raw sample was 87.6% English and 12.3% French; French was weighted up because it is the language of my work.
