#!/usr/bin/env python3
"""Throwaway layout analyzer + optimizer for the Toucan (3x6+3 per hand), scored on the user's own corpus."""
import os, re, sys, math, random, unicodedata, collections, json

HERE = os.path.dirname(os.path.abspath(__file__))
CORPUS = os.path.join(HERE, "corpus")
CHARS = "abcdefghijklmnopqrstuvwxyz,.'-"          # 30 symbols placed on the 3x10 core
# ---------------- geometry (from toucan.dtsi, 100 units = 1u) ----------------
# core columns 0..9 = left pinky..left index-inner, right index-inner..right pinky
COL_Y = [37, 12, 0, 12, 24, 24, 12, 0, 12, 37]          # column stagger offset
FINGER = [0, 1, 2, 3, 3, 4, 4, 5, 6, 7]                 # 0=Lp 1=Lr 2=Lm 3=Li 4=Ri 5=Rm 6=Rr 7=Rp
HAND = [0, 0, 0, 0, 0, 1, 1, 1, 1, 1]
HOME_COL = {0: 0, 1: 1, 2: 2, 3: 3, 4: 6, 5: 7, 6: 8, 7: 9}  # home column per finger
FINGER_W = {0: 1.6, 1: 1.2, 2: 1.0, 3: 1.0, 4: 1.0, 5: 1.0, 6: 1.2, 7: 1.6}
def pos(i):  # key index 0..29 -> (x,y) in units, row 0..2 col 0..9
    r, c = divmod(i, 10); return (c * 100 + (300 if c >= 5 else 0), r * 100 + COL_Y[c]), r, c
POS = [pos(i) for i in range(30)]
def effort(i):
    (x, y), r, c = POS[i]; f = FINGER[c]
    hx, hy = POS[10 + HOME_COL[f]][0]
    d = math.hypot(x - hx, y - hy) / 100
    lateral = 1.3 if c in (4, 5) else 1.0            # inner index columns
    return (1 + d) * FINGER_W[f] * lateral
EFFORT = [effort(i) for i in range(30)]

# ---------------- corpus ----------------
def norm(ch):
    b = unicodedata.normalize("NFD", ch)[0].lower()
    if b in "’‘": b = "'"
    if b in "–—": b = "-"
    return b if b in CHARS else " "
def load(lang):
    p = os.path.join(CORPUS, f"local_{lang}.txt")
    return open(p, encoding="utf-8").read() if os.path.exists(p) else ""
def ngrams(text):
    s = "".join(norm(c) for c in text)
    uni, bi, tri, skip = collections.Counter(), collections.Counter(), collections.Counter(), collections.Counter()
    for w in s.split():
        for i, c in enumerate(w):
            uni[c] += 1
            if i >= 1: bi[w[i-1] + c] += 1
            if i >= 2: tri[w[i-2:i+1]] += 1; skip[w[i-2] + c] += 1
    return uni, bi, tri, skip
def mix(weights):
    """weights: {lang: share}. Returns normalised counters."""
    out = [collections.Counter() for _ in range(4)]
    for lang, w in weights.items():
        grams = ngrams(load(lang))
        tot = sum(grams[0].values()) or 1
        for o, g in zip(out, grams):
            for k, v in g.items(): o[k] += w * v / tot
    return out

# ---------------- layouts ----------------
LAYOUTS = {
 "QWERTY":      "qwertyuiopasdfghjkl;zxcvbnm,./",
 "Colemak-DH":  "qwfpbjluy;arstgmneiozxcdvkh,./",
 "Graphite":    "bldwz'foujnrtsgyhaeiqxmcvkp.-/",
 "Gallium":     "bldcvjyou,nrtsgphaeixqmwzkf';.",
 "Canary":      "wlypbzfou'crstgmneiaqjvdkxh/,.",
 "Sturdy":      "vmlcpxfoujstrdy.naeizkqgwbh';,",
 "Ergo-L":      "qcopwjmd'yasenflrtiuzx-vb.hg,k",   # ★ dead key modelled as apostrophe
 "Optimot":     "ajoebfdl'qaieu,ptsrnkye.wgcmhv",   # à/é/è keys modelled as a/e/e (user types accentless)
}
# ---------------- metrics ----------------
def analyse(layout, uni, bi, tri, skip):
    where = {}
    for i, ch in enumerate(layout):
        where.setdefault(ch, i)   # Optimot duplicates: first occurrence wins
    def fin(ch): return FINGER[POS[where[ch]][2]] if ch in where else None
    def col(ch): return POS[where[ch]][2]
    def row(ch): return POS[where[ch]][1]
    tot_u = sum(v for k, v in uni.items() if k in where) or 1
    tot_b = sum(v for k, v in bi.items() if k[0] in where and k[1] in where) or 1
    tot_t = sum(v for k, v in tri.items() if all(c in where for c in k)) or 1
    m = collections.defaultdict(float)
    fload = collections.Counter()
    for ch, v in uni.items():
        if ch not in where: continue
        fload[fin(ch)] += v / tot_u
        m["effort"] += EFFORT[where[ch]] * v / tot_u
        if row(ch) == 1: m["home"] += v / tot_u
    m["pinky"] = fload[0] + fload[7]
    m["hand_L"] = sum(fload[f] for f in range(4))
    for (a, b), v in bi.items():
        if a not in where or b not in where or a == b: continue
        v /= tot_b
        fa, fb = fin(a), fin(b)
        if fa == fb: m["sfb"] += v; continue
        if HAND[col(a)] == HAND[col(b)]:
            dr = abs(row(a) - row(b))
            if dr == 2 and abs(fa - fb) == 1: m["scissor"] += v
            # lateral stretch: inner index col with middle finger
            if {col(a), col(b)} in ({4, 2}, {5, 7}): m["lsb"] += v
            inward = (fb > fa) if HAND[col(a)] == 0 else (fb < fa)
            m["roll_in" if inward else "roll_out"] += v
        else:
            m["alt"] += v
    for (a, b), v in skip.items():
        if a in where and b in where and a != b and fin(a) == fin(b): m["sfs"] += v / tot_b
    for t, v in tri.items():
        if not all(c in where for c in t): continue
        h = [HAND[col(c)] for c in t]; f = [fin(c) for c in t]
        if h[0] == h[1] == h[2] and len(set(f)) == 3:
            d1, d2 = f[1] - f[0], f[2] - f[1]
            if (d1 > 0) != (d2 > 0): m["redirect"] += v / tot_t
    m["fload"] = fload
    return m

def score(m):  # lower is better; weights in the spirit of common analyzers
    return (m["sfb"] * 100 * 3.0 + m["sfs"] * 100 * 0.8 + m["scissor"] * 100 * 1.5 + m["lsb"] * 100 * 1.0
            + m["effort"] * 4.0 + max(0, m["pinky"] - 0.12) * 100 * 1.0
            - m["roll_in"] * 100 * 0.25 - m["alt"] * 100 * 0.05
            + abs(m["hand_L"] - 0.5) * 100 * 0.5)

def fmt(name, m):
    fl = m["fload"]
    return (f"{name:12s} sfb {100*m['sfb']:5.2f}  sfs {100*m['sfs']:5.2f}  sciss {100*m['scissor']:4.2f}  lsb {100*m['lsb']:4.2f}  "
            f"redir {100*m['redirect']:5.2f}  rollIn {100*m['roll_in']:5.2f}  alt {100*m['alt']:5.2f}  home {100*m['home']:5.1f}  "
            f"pinky {100*m['pinky']:5.1f}  L/R {100*m['hand_L']:4.1f}/{100*(1-m['hand_L']):4.1f}  effort {m['effort']:.3f}  score {score(m):6.2f}")

def show(layout):
    rows = [layout[r*10:(r+1)*10] for r in range(3)]
    return "\n".join("  " + " ".join(r[:5]) + "   " + " ".join(r[5:]) for r in rows)

# ---------------- optimizer (simulated annealing on bigram-level metrics) ----------------
def optimise(uni, bi, skip, pinned=None, iters=120000, seed=1):
    rnd = random.Random(seed)
    pinned = pinned or {}
    free = [i for i in range(30) if i not in pinned.values()]
    chars = [c for c in CHARS if c not in pinned]
    lay = [None] * 30
    for c, i in pinned.items(): lay[i] = c
    rnd.shuffle(chars)
    for i, c in zip(free, chars): lay[i] = c
    def sc(l):
        m = analyse("".join(l), uni, bi, collections.Counter(), skip); return score(m)
    cur = sc(lay); best, bestl = cur, lay[:]
    T0, T1 = 2.0, 0.01
    for k in range(iters):
        T = T0 * (T1 / T0) ** (k / iters)
        i, j = rnd.sample(free, 2)
        lay[i], lay[j] = lay[j], lay[i]
        s = sc(lay)
        if s < cur or rnd.random() < math.exp((cur - s) / T):
            cur = s
            if s < best: best, bestl = s, lay[:]
        else:
            lay[i], lay[j] = lay[j], lay[i]
    return "".join(bestl)

if __name__ == "__main__":
    scen = sys.argv[1] if len(sys.argv) > 1 else "corpus"
    weights = {"corpus": {"en": 0.87, "fr": 0.12, "dar": 0.01}, "even": {"en": 0.5, "fr": 0.45, "dar": 0.05}}[scen]
    uni, bi, tri, skip = mix(weights)
    print(f"scenario={scen} weights={weights}")
    res = {}
    for name, lay in LAYOUTS.items():
        res[name] = analyse(lay, uni, bi, tri, skip)
    if "--opt" in sys.argv:
        iters = 150000
        for label, pinned in [("Custom", {}), ("Custom-ZXCV", {"z": 20, "x": 21, "c": 22, "v": 23})]:
            lay = optimise(uni, bi, skip, pinned, iters=iters, seed=7)
            LAYOUTS[label] = lay; res[label] = analyse(lay, uni, bi, tri, skip)
    for name, m in sorted(res.items(), key=lambda kv: score(kv[1])):
        print(fmt(name, m))
    for name in ("Custom", "Custom-ZXCV"):
        if name in LAYOUTS: print(f"\n{name}:\n{show(LAYOUTS[name])}")
    json.dump({k: v for k, v in LAYOUTS.items()}, open(os.path.join(HERE, f"layouts_{scen}.json"), "w"), indent=1)
