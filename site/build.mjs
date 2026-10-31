// Builds index.html from index.tmpl.html: the keyboard boards are drawn from the trainer's keymap.js (itself
// generated from firmware/config/toucan.keymap), so every label on the site is the firmware's own.
//   node build.mjs
import fs from "node:fs";
const here = new URL(".", import.meta.url).pathname;
const src = fs.readFileSync(new URL("../trainer/keymap.js", import.meta.url), "utf8");
const T = JSON.parse(src.slice(src.indexOf("{"), src.lastIndexOf("}") + 1));
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

// the layers the page shows, in tab order; held = thumb positions painted orange (what you hold to be here)
const SHOWN = [
  { id: "wld", name: "WLD", layer: 0, held: [36, 37, 40], caption: "Letters placed by annealing on 1.68 million characters of my writing. The dark keys spell the name, hands alternating; the orange keys lead to a layer." },
  { id: "nav", name: "NAV", layer: 2, held: [37], caption: "Hold the left middle thumb. Digits on the top row, arrows under the right home row, modifiers under the left." },
  { id: "sym", name: "SYM", layer: 3, held: [40], caption: "Hold the right middle thumb. Punctuation and brackets without Shift, pairs side by side." },
  { id: "adj", name: "ADJ", layer: 4, held: [37, 40], caption: "Hold both middle thumbs. Bluetooth profiles, function keys, media, bootloader and reset, and the GAME toggle." },
  { id: "acc", name: "Accents", layer: 6, held: [36], caption: "Tap Ctrl once, then the letter: é à ù î ô ç. Tap twice for è â û ï, three times for ê ü, four for ë." },
  { id: "game", name: "GAME", layer: 1, held: [], caption: "Plain QWERTY, locked with ADJ and the bottom-left letter key. No hold layers, so nothing fires by accident mid-fight." },
];
const SMALL = { "␣": "Space", "Ret": "Enter", "BkSp": "Bksp", "Unlock": "Studio" };   // Unlock = the ZMK Studio unlock key
const sub = (k, i, layerId) => {   // the second, smaller label on a key
  if (layerId === "wld" && i === 36) return "tap: accent";
  if (layerId === "acc" && i === 36) return "tap again";
  if (k.kind === "layer") return "hold";
  return "";
};
const main = (k, i, layerId) => {
  if (layerId === "acc" && i === 36) return "Ctrl";
  if (k.kind === "trans") return "";
  return SMALL[k.label] ?? k.label ?? "";
};
const NAME = ["W", "A", "L", "I", "D"];
const W = 1400, H = 480;
function board(L) {
  const keys = T.layers[L.layer].keys;
  let s = "";
  T.phys.forEach((p, i) => {
    const k = keys[i], m = main(k, i, L.id), t = sub(k, i, L.id);
    const held = L.held.includes(i), empty = k.kind === "trans", name = L.id === "wld" && NAME.includes(k.label);   // w a l i d: where the name sits
    const tf = p.r ? ` transform="rotate(${p.r} ${p.rx} ${p.ry})"` : "";
    const cls = ["key", empty ? "key--empty" : "", held ? "key--held" : "", name ? "key--name" : "", m.length > 3 ? "key--long" : ""].filter(Boolean).join(" ");
    s += `<g class="${cls}"${tf}>`;
    if (!empty) s += `<rect class="cast" x="${p.x + 10}" y="${p.y + 10}" width="${p.w - 8}" height="${p.h - 8}"/>`;
    s += `<rect class="cap" x="${p.x + 4}" y="${p.y + 4}" width="${p.w - 8}" height="${p.h - 8}"/>`;
    if (m) s += `<text class="lbl" x="${p.x + p.w / 2}" y="${p.y + p.h / 2 + (t ? -6 : 2)}">${esc(m)}</text>`;
    if (t) s += `<text class="sub" x="${p.x + p.w / 2}" y="${p.y + p.h / 2 + 30}">${esc(t)}</text>`;
    s += `</g>`;
  });
  return `<svg class="board" viewBox="-8 -8 ${W + 16} ${H}" role="img" aria-label="The Toucan2 keymap, ${L.name} layer, every key labelled">${s}</svg>`;
}
const tabs = SHOWN.map((L, n) => `<input type="radio" name="layer" id="tab-${L.id}" value="${L.id}"${n ? "" : " checked"}><label for="tab-${L.id}">${L.name}</label>`).join("");
const panels = SHOWN.map((L) => `<figure class="layer" data-layer="${L.id}">${board(L)}<figcaption>${esc(L.caption)}</figcaption></figure>`).join("\n");
const boards = `<div class="layers">
  <fieldset class="seg" aria-label="Layer"><legend class="visually-hidden">Layer</legend>${tabs}</fieldset>
  ${panels}
</div>`;
// the eight results of the final annealing run, read from its log so each board keeps its seed; seed 5 is the Walid layout
const LOG = fs.readFileSync(new URL("../layout-optimizer/opt2_free_v2.log", import.meta.url), "utf8");
const RUN = [...LOG.matchAll(/seed (\d+): score ([\d.]+)\n((?:  .*\n){3})/g)].map((m) => ({ seed: +m[1], score: +m[2], layout: m[3].replace(/\s+/g, "") })).sort((x, y) => x.score - y.score);
const WLD = "bwldqzoy,kcsntv.aeihpgrmj'x-uf";
const mirror = (L) => [0, 1, 2].map((r) => [...L.slice(r * 10, r * 10 + 10)].reverse().join("")).join("");
const grid = (layout, diff) => `<span class="cand__grid" aria-label="${esc(layout)}">${[...layout].map((c, j) => `${j % 10 === 5 ? '<i class="gap" aria-hidden="true"></i>' : ""}<i${diff && diff[j] !== c ? ' class="is-diff"' : ""}>${esc(c)}</i>`).join("")}</span>`;
const cand = RUN.map((r) => {
  // measured against the pick, or against its mirror when that is nearer: the score cannot tell left from right
  const pick = r.layout === WLD, dist = (ref) => [...r.layout].filter((c, j) => c !== ref[j]).length;
  const flipped = dist(mirror(WLD)) < dist(WLD), ref = flipped ? mirror(WLD) : WLD, apart = dist(ref);
  const note = pick ? "the pick" : apart === 0 ? "the mirror" : `${apart} apart${flipped ? ", mirrored" : ""}`;
  return `<li class="cand${pick ? " cand--pick" : ""}">${grid(r.layout, pick ? null : ref)}<span class="cand__score">Seed ${r.seed}<b class="num">${r.score.toFixed(2)}</b><span>${note}</span></span></li>`;
}).join("\n");
const candidates = `<ol class="cands" aria-label="The eight boards of the final run by seed, with their scores (lower is better)">${cand}</ol>`;

// ---- step 2: the cost map (analyzer.py's effort model, same formula) ----
const COL_Y = [37, 12, 0, 12, 24, 24, 12, 0, 12, 37], FINGER = [0, 1, 2, 3, 3, 4, 4, 5, 6, 7];
const HOME_COL = { 0: 0, 1: 1, 2: 2, 3: 3, 4: 6, 5: 7, 6: 8, 7: 9 }, FINGER_W = { 0: 1.6, 1: 1.2, 2: 1.0, 3: 1.0, 4: 1.0, 5: 1.0, 6: 1.2, 7: 1.6 };
const corePos = (i) => { const r = Math.floor(i / 10), c = i % 10; return [c * 100 + (c >= 5 ? 300 : 0), r * 100 + COL_Y[c]]; };   // the analyzer's own spacing
const drawPos = (i) => { const [x, y] = corePos(i); return [x - (i % 10 >= 5 ? 160 : 0), y]; };   // drawn closer: the gap is a hand's width, not the analyzer's
const effort = (i) => { const c = i % 10, f = FINGER[c], [x, y] = corePos(i), [hx, hy] = corePos(10 + HOME_COL[f]); const d = Math.hypot(x - hx, y - hy) / 100; return (1 + d) * FINGER_W[f] * (c === 4 || c === 5 ? 1.3 : 1); };
const EFF = [...Array(30)].map((_, i) => effort(i)), EMIN = Math.min(...EFF), EMAX = Math.max(...EFF);
function costMap() {
  let s = "";
  EFF.forEach((e, i) => {
    const [x, y] = drawPos(i), t = (e - EMIN) / (EMAX - EMIN), dark = t > 0.5;
    s += `<g class="ekey${dark ? " ekey--dark" : ""}" style="--e:${(0.06 + 0.84 * t).toFixed(2)}"><rect class="cap" x="${x + 4}" y="${y + 4}" width="92" height="92"/><text x="${x + 50}" y="${y + 58}">${e.toFixed(2).replace(/0+$/, "").replace(/\.$/, "")}</text></g>`;
  });
  return `<svg class="emap" viewBox="-4 -4 1148 348" role="img" aria-label="The thirty core keys with their cost: home keys 1, far corners 3.2">${s}</svg>`;
}
// ---- step 4: seed 5's own run (data-anneal-seed5.json, the optimiser rerun with a trace): current and best score over the 60,000 swaps
const TRACE = JSON.parse(fs.readFileSync(here + "data-anneal-seed5.json", "utf8"));
function annealChart() {
  const W = 1000, H = 440, L = 110, R = 150, T = 24, B = 76, rows = TRACE.rows, n = TRACE.iters;
  const y0 = 20, y1 = 140, sx = (k) => L + (k / n) * (W - L - R), sy = (v) => T + (1 - (v - y0) / (y1 - y0)) * (H - T - B);
  const path = (col) => rows.map((r, i) => `${i ? "L" : "M"}${sx(r[0]).toFixed(1)} ${sy(Math.min(y1, r[col])).toFixed(1)}`).join("");
  const grid = [25, 50, 75, 100, 125].map((v) => `<line class="grid" x1="${L}" x2="${W - R}" y1="${sy(v)}" y2="${sy(v)}"/><text class="tick" x="${L - 10}" y="${sy(v) + 5}" text-anchor="end">${v}</text>`).join("");
  const xt = [0, 15000, 30000, 45000, 60000].map((k) => { const t = 3 * Math.pow(0.02 / 3, k / n); return `<text class="tick" x="${sx(k)}" y="${H - B + 26}" text-anchor="middle">${k / 1000}k</text><text class="tick tick--t" x="${sx(k)}" y="${H - B + 50}" text-anchor="middle">${t >= 1 ? t.toFixed(0) : t.toFixed(2)}</text>`; }).join("");
  const last = rows[rows.length - 1];
  return `<figure class="anneal"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Seed 5: the board's score over sixty thousand swaps, from 132 down to 25.5, with the best score so far">
    ${grid}${xt}
    <text class="tick" x="${L - 10}" y="${T - 6}" text-anchor="end">score</text><text class="tick" x="${L - 36}" y="${H - B + 26}" text-anchor="end">swaps</text><text class="tick tick--t" x="${L - 36}" y="${H - B + 50}" text-anchor="end">temp.</text>
    <path class="line line--cur" pathLength="1" d="${path(1)}"/><path class="line line--best" pathLength="1" d="${path(2)}"/>
    <text class="lbl" x="${sx(n) + 10}" y="${sy(last[1]) - 8}">current board</text><text class="lbl lbl--best" x="${sx(n) + 10}" y="${sy(last[2]) + 18}">best, ${last[2].toFixed(2)}</text>
    <g class="hov" style="display:none"><line y1="${T}" y2="${H - B}"/><circle r="6"/><text></text></g>
  </svg><p class="anneal__key"><span><i class="anneal__cur"></i>current board</span><span><i class="anneal__best"></i>best so far</span></p><script type="application/json" id="anneal-data">${JSON.stringify({ L, R, T, B, W, H, y0, y1, n, rows })}</script></figure>`;
}


// ---- the habits, each drawn on one hand of the board: the keys struck in order, the finger that strikes them ----
// core index (0..29, the WLD string's order) -> phys index; the fingers and home keys are the analyzer's own tables
const physOf = (i) => { const r = Math.floor(i / 10), c = i % 10; return r * 12 + (c < 5 ? 1 + c : 6 + c - 5); };
const coreOf = (ch) => WLD.indexOf(ch);
const HOME = (f) => 10 + HOME_COL[f], cost = (e) => e.toFixed(1).replace(/\.0$/, "");
const HABITS = [
  { id: "sfb", name: "Same-finger bigram", word: "suite", keys: "ui", text: "u then i, both with the right ring finger, as in <b>suite</b>. The finger has to travel between two strokes." },
  { id: "sfs", name: "Skipgram", word: "aux", keys: "aux", text: "a, then u, then x: the right index twice with one letter between, as in <b>aux</b>." },
  { id: "redirect", name: "Redirect", word: "you", keys: "you", text: "y, o, u on one hand: the fingers go inward, then turn back outward, as in <b>you</b>." },
  { id: "lsb", name: "Lateral stretch", word: "envie", keys: "nv", text: "n then v: the index reaches sideways to the inner column, as in <b>envie</b>." },
  { id: "scissor", name: "Scissors", word: "anglais", keys: "gl", text: "g then l: neighbouring fingers, one on the bottom row and one on the top, as in <b>anglais</b>." },
  { id: "roll", name: "Roll", word: "sont", keys: "nt", text: "n then t: two neighbouring fingers walk towards the thumb, as in <b>sont</b>. The one habit the score rewards." },
  { id: "travel", name: "Travel", keys: "tdq", costs: true, text: "" },   // the text is written below, from the cost map
  { id: "home", name: "Home row", keys: "csnt", rest: true, text: "The four resting keys of each hand: c s n t here, a e i h on the right. A keystroke that lands on one is free." },
  { id: "pinky", name: "Pinkies", keys: "bcp", rest: true, text: "The weakest finger’s column: b c p here, k h f on the right. The score fines a pinky above 13% of keystrokes." },
];
function handSvg(h) {
  const steps = [...h.keys].map(coreOf), right = steps[0] % 10 >= 5, cols = right ? [5, 6, 7, 8, 9] : [0, 1, 2, 3, 4];
  const ox = Math.min(...cols.map((c) => T.phys[physOf(c)].x)), kx = (i) => T.phys[physOf(i)].x - ox, ky = (i) => T.phys[physOf(i)].y;
  const cx = (i) => kx(i) + 50, cy = (i) => ky(i) + 50, mid = 250;
  const fingers = right ? [4, 5, 6, 7] : [0, 1, 2, 3];
  const used = new Set(steps.map((i) => FINGER[i % 10]));
  // the hand: four fingers from the palm to their home keys, the palm half out of the frame
  let hand = `<ellipse class="palm" cx="${mid}" cy="700" rx="250" ry="110"/>`, tips = "";
  for (const f of fingers) { const i = HOME(f), on = used.has(f); const bx = mid + (cx(i) - mid) * 0.7; hand += `<line class="fng${on ? " fng--on" : ""}" x1="${bx}" y1="640" x2="${cx(i)}" y2="${cy(i)}"/>`; tips += `<circle class="tip${on ? " tip--on" : ""}" cx="${cx(i)}" cy="${cy(i)}" r="21"/>`; }
  // a segment between two key centres, trimmed so it never crosses a letter
  const seg = (a, b, pad) => { const dx = cx(b) - cx(a), dy = cy(b) - cy(a), d = Math.hypot(dx, dy), ux = dx / d, uy = dy / d; return `x1="${(cx(a) + ux * pad).toFixed(1)}" y1="${(cy(a) + uy * pad).toFixed(1)}" x2="${(cx(b) - ux * pad).toFixed(1)}" y2="${(cy(b) - uy * pad).toFixed(1)}"`; };
  // the keys
  let keys = "";
  for (let r = 0; r < 3; r++) for (const c of cols) { const i = r * 10 + c; keys += `<g class="key"><rect class="cast" x="${kx(i) + 10}" y="${ky(i) + 10}" width="92" height="92"/><rect class="cap" x="${kx(i) + 4}" y="${ky(i) + 4}" width="92" height="92"/><text class="lbl" x="${cx(i)}" y="${cy(i) + 2}">${esc(WLD[i])}</text></g>`; }
  // the strokes: a reach from where the finger was (its home, or the last key it struck) to the key, the key lit, its number; a thin route between successive keys
  let strokes = "", at = {}, k = 0, prev = null;
  for (const i of steps) {
    const f = FINGER[i % 10], from = at[f] ?? HOME(f), tag = h.costs ? cost(EFF[i]) : h.rest ? "" : String(k + 1);
    const seq = h.rest ? "" : ` style="--k:${k}"`;
    if (from !== i) strokes += `<line class="reach s" pathLength="1"${seq} ${seg(from, i, 26)}/>`;
    if (prev !== null && !h.costs && prev !== from) strokes += `<line class="route s" pathLength="1"${seq} ${seg(prev, i, 30)}/>`;
    strokes += `<g class="hit s"${seq}><rect class="on" x="${kx(i) + 4}" y="${ky(i) + 4}" width="92" height="92"/><text class="lbl" x="${cx(i)}" y="${cy(i) + 2}">${esc(WLD[i])}</text>${tag ? (h.costs ? `<text class="tag tag--low" x="${kx(i) + 12}" y="${ky(i) + 90}">${tag}</text>` : `<text class="tag" x="${kx(i) + 88}" y="${ky(i) + 30}">${tag}</text>`) : ""}</g>`;
    if (!h.costs) at[f] = i;   // travel measures every key from home
    prev = i; k++;
  }
  const label = h.costs ? "the left index from its home key T to D and to Q, each key with its cost" : `the keys ${[...h.keys].join(", ")} on the ${right ? "right" : "left"} hand, struck in order`;
  return `<svg class="hand" viewBox="-6 -6 512 666" role="img" aria-label="${esc(h.name)}: ${esc(label)}">${hand}${keys}${tips}${strokes}</svg>`;
}
HABITS.find((h) => h.id === "travel").text = `From its home on t the left index pays ${cost(EFF[coreOf("t")])} there, ${cost(EFF[coreOf("d")])} for d, ${cost(EFF[coreOf("q")])} for q. Travel is this cost averaged over every keystroke.`;
const habits = `<ol class="habits">${HABITS.map((h) => `<li class="habit">${handSvg(h)}<h3>${esc(h.name)}</h3><p>${h.text}</p></li>`).join("\n")}</ol>`;

const tmpl = fs.readFileSync(here + "index.tmpl.html", "utf8");
fs.writeFileSync(here + "index.html", tmpl.replace("<!--BOARDS-->", boards).replace("<!--CANDIDATES-->", candidates).replace("<!--EFFORT-->", costMap()).replace("<!--ANNEAL-->", annealChart()).replace("<!--HABITS-->", habits));
console.log("index.html written,", SHOWN.length, "boards");
