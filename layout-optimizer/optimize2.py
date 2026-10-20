#!/usr/bin/env python3
"""Fast simulated-annealing layout optimiser with the full metric set (incl. redirects)."""
import sys, os, math, random, json, collections
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import analyzer as A

WEIGHTS = {"en": 0.65, "fr": 0.33, "dar": 0.02}
CH = A.CHARS; IDX = {c: i for i, c in enumerate(CH)}
N = 30
FING = [A.FINGER[A.POS[i][2]] for i in range(N)]
HANDP = [A.HAND[A.POS[i][2]] for i in range(N)]
ROW = [A.POS[i][1] for i in range(N)]
COL = [A.POS[i][2] for i in range(N)]
EFF = A.EFFORT

def prep(weights, top_bi=700, top_tri=2500):
    uni, bi, tri, skip = A.mix(weights)
    u = [0.0] * len(CH)
    for c, v in uni.items():
        if c in IDX: u[IDX[c]] = v
    tu = sum(u) or 1; u = [x / tu for x in u]
    def tab(cnt, n):
        items = [(k, v) for k, v in cnt.items() if all(c in IDX for c in k) and len(set(k)) == len(k) or (len(k) == 3 and all(c in IDX for c in k))]
        tot = sum(v for _, v in items) or 1
        items.sort(key=lambda kv: -kv[1])
        return [(tuple(IDX[c] for c in k), v / tot) for k, v in items[:n]]
    return u, tab(bi, top_bi), tab(skip, top_bi), tab(tri, top_tri)

# pairwise position classes, precomputed: 0 none,1 sfb,2 scissor,3 lsb ; plus roll dir
def pair_class(p, q):
    if p == q: return None
    fa, fb = FING[p], FING[q]
    if fa == fb: return "sfb"
    if HANDP[p] != HANDP[q]: return "alt"
    tags = []
    if abs(ROW[p] - ROW[q]) == 2 and abs(fa - fb) == 1: tags.append("scissor")
    if {COL[p], COL[q]} in ({4, 2}, {5, 7}): tags.append("lsb")
    inward = (fb > fa) if HANDP[p] == 0 else (fb < fa)
    tags.append("in" if inward else "out")
    return tags
PC = [[pair_class(p, q) for q in range(N)] for p in range(N)]

def score_layout(place, u, bi, skip, tri, w):
    """place[c] = position of char index c."""
    sfb = sfs = sc = lsb = rin = rout = alt = red = bad = 0.0
    eff = 0.0; fl = [0.0] * 8
    for c in range(len(CH)):
        p = place[c]; eff += EFF[p] * u[c]; fl[FING[p]] += u[c]
    for (a, b), v in bi:
        cl = PC[place[a]][place[b]]
        if cl == "sfb": sfb += v
        elif cl == "alt": alt += v
        elif cl:
            for t in cl:
                if t == "scissor": sc += v
                elif t == "lsb": lsb += v
                elif t == "in": rin += v
                else: rout += v
    for (a, b), v in skip:
        if PC[place[a]][place[b]] == "sfb": sfs += v
    for (a, b, c), v in tri:
        pa, pb, pc = place[a], place[b], place[c]
        if HANDP[pa] == HANDP[pb] == HANDP[pc]:
            fa, fb, fc = FING[pa], FING[pb], FING[pc]
            if fa != fb != fc and fa != fc:
                if ((fb - fa) > 0) != ((fc - fb) > 0):
                    red += v
                    if 3 not in (fa, fb, fc) and 4 not in (fa, fb, fc): bad += v
    pinky = fl[0] + fl[7]; left = sum(fl[:4])
    CAP = [0.08, 0.115, 0.17, 0.19, 0.19, 0.17, 0.115, 0.08]
    over = sum(max(0.0, fl[f] - CAP[f]) for f in range(8))
    s = (w["sfb"] * sfb + w["sfs"] * sfs + w["scissor"] * sc + w["lsb"] * lsb + w["redirect"] * red + w["bad_redirect"] * bad
         - w["roll_in"] * rin - w["roll_out"] * rout - w["alt"] * alt) * 100
    s += w["effort"] * eff + w["pinky"] * max(0.0, pinky - 0.13) * 100 + w["balance"] * abs(left - 0.5) * 100 + w["overload"] * over * 100
    return s

W = {"sfb": 3.0, "sfs": 0.8, "scissor": 1.5, "lsb": 1.0, "redirect": 1.2, "bad_redirect": 2.0,
     "roll_in": 0.12, "roll_out": 0.05, "alt": 0.0, "effort": 8.0, "pinky": 1.0, "balance": 0.5, "overload": 1.5}

def anneal(u, bi, skip, tri, pinned, seed, iters):
    rnd = random.Random(seed)
    place = [None] * len(CH)
    used = set()
    for c, p in pinned.items(): place[IDX[c]] = p; used.add(p)
    free_pos = [p for p in range(N) if p not in used]; rnd.shuffle(free_pos)
    free_c = [i for i in range(len(CH)) if place[i] is None]
    for i, p in zip(free_c, free_pos): place[i] = p
    cur = score_layout(place, u, bi, skip, tri, W); best, bestp = cur, place[:]
    T0, T1 = 3.0, 0.02
    for k in range(iters):
        T = T0 * (T1 / T0) ** (k / iters)
        i, j = rnd.sample(free_c, 2)
        place[i], place[j] = place[j], place[i]
        s = score_layout(place, u, bi, skip, tri, W)
        if s < cur or rnd.random() < math.exp((cur - s) / T):
            cur = s
            if s < best: best, bestp = s, place[:]
        else:
            place[i], place[j] = place[j], place[i]
    return best, bestp

def to_string(place):
    lay = [None] * N
    for c, p in enumerate(place): lay[p] = CH[c]
    return "".join(lay)

if __name__ == "__main__":
    variant = sys.argv[1] if len(sys.argv) > 1 else "free"
    seeds = int(sys.argv[2]) if len(sys.argv) > 2 else 8
    iters = int(sys.argv[3]) if len(sys.argv) > 3 else 60000
    u, bi, skip, tri = prep(WEIGHTS)
    # ZXCV variant: keep z x c v somewhere on the left-hand bottom row (positions 20..24), order free
    pinned_sets = {"free": [{}], "zxcv": None}
    results = []
    for seed in range(seeds):
        if variant == "zxcv":
            rnd = random.Random(seed); pos = rnd.sample(range(20, 25), 4)
            pinned = dict(zip("zxcv", pos))
        else:
            pinned = {}
        best, place = anneal(u, bi, skip, tri, pinned, seed, iters)
        lay = to_string(place); results.append((best, lay))
        print(f"seed {seed}: score {best:.3f}\n{A.show(lay)}", flush=True)
    results.sort()
    print("\n=== ranking:", " ".join(f"{s:.2f}" for s, _ in results))
    json.dump([{"score": s, "layout": l} for s, l in results], open(os.path.join(os.path.dirname(os.path.abspath(__file__)), f"custom_{variant}{os.environ.get('TAG','')}.json"), "w"), indent=1)
    # full report for the best vs references, same weighting
    uni, bi2, tri2, skip2 = A.mix(WEIGHTS)
    print("\n=== full metrics (65/33/2 weighting)")
    rows = {"Custom-" + variant: results[0][1], "Graphite": A.LAYOUTS["Graphite"], "Ergo-L": A.LAYOUTS["Ergo-L"], "QWERTY": A.LAYOUTS["QWERTY"]}
    for name, lay in rows.items(): print(A.fmt(name, A.analyse(lay, uni, bi2, tri2, skip2)))
