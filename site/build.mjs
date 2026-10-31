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
  { id: "sfb", name: "Same-finger bigram", keys: "ui", text: "Two keys in a row for one finger: u then i in <b>suite</b>. The finger travels between the strokes." },
  { id: "sfs", name: "Skipgram", keys: "aux", text: "The same finger twice with one key between: a, u, x in <b>aux</b>." },
  { id: "redirect", name: "Redirect", keys: "you", text: "Three keys on one hand that change direction: y, o, u in <b>you</b>, inward then back out." },
  { id: "lsb", name: "Lateral stretch", keys: "nv", text: "The index reaches sideways to the inner column: n then v in <b>envie</b>." },
  { id: "scissor", name: "Scissors", keys: "gl", text: "Neighbouring fingers, one on the bottom row and one on the top: g then l in <b>anglais</b>." },
  { id: "roll", name: "Roll", keys: "nt", text: "Neighbouring fingers walking towards the thumb: n then t in <b>sont</b>. The one habit the score rewards." },
  { id: "travel", name: "Travel", keys: "tdq", costs: true, text: "" },   // the text is written below, from the cost map
  { id: "home", name: "Home row", keys: "csnt", rest: true, text: "The four resting keys of each hand: c s n t here, a e i h on the right. A stroke there is free." },
  { id: "pinky", name: "Pinkies", keys: "bcp", rest: true, text: "The weakest finger’s column: b c p here, k h f on the right. The score fines a pinky above 13% of keystrokes." },
];
// one glyph: the hand's fifteen keys, a palm, four fingers resting on their home keys; the fingers that strike
// carry their pose at each of the four slots of the loop (angle, stretch, tip offset) as custom properties,
// the keys they strike light in turn; without motion every stroke shows at once
function handSvg(h, n) {
  const steps = [...h.keys].map(coreOf), right = steps[0] % 10 >= 5, cols = right ? [5, 6, 7, 8, 9] : [0, 1, 2, 3, 4];
  const ox = Math.min(...cols.map((c) => T.phys[physOf(c)].x)) - 6, kx = (i) => T.phys[physOf(i)].x - ox, ky = (i) => T.phys[physOf(i)].y + 6;
  const cx = (i) => kx(i) + 50, cy = (i) => ky(i) + 50, f1 = (v) => (+v.toFixed(1)).toString();
  const fingers = right ? [4, 5, 6, 7] : [0, 1, 2, 3], used = new Set(steps.map((i) => FINGER[i % 10]));
  const px = right ? 270 : 242, py = 560, rx = 240, ry = 120;   // the palm, its top edge at 440, mostly out of the frame
  const base = (f) => { const bx = px + (cx(HOME(f)) - px) * 0.7; return [bx, py - ry * Math.sqrt(1 - ((bx - px) / rx) ** 2)]; };
  const pose = (f, i) => { const [bx, by] = base(f), dx = cx(i) - bx, dy = by - cy(i); return { a: Math.atan2(dx, dy) * 180 / Math.PI, r: Math.hypot(dx, dy) }; };
  // where every finger is after each step: the key it struck, or where it already was; four slots, the last held
  const cur = Object.fromEntries(fingers.map((f) => [f, HOME(f)])), where = Object.fromEntries(fingers.map((f) => [f, []]));
  for (const i of steps) { cur[FINGER[i % 10]] = i; fingers.forEach((f) => where[f].push(cur[f])); }
  fingers.forEach((f) => { while (where[f].length < 4) where[f].push(where[f].at(-1)); });
  let rest = `<ellipse class="palm" cx="${px}" cy="${py}" rx="${rx}" ry="${ry}"/>`, active = "";
  for (const f of fingers) {
    const [bx, by] = base(f), home = pose(f, HOME(f)), L = home.r;
    let vars = `transform-origin:${f1(bx)}px ${f1(by)}px;--a0:${f1(home.a)}deg`;
    if (used.has(f)) where[f].forEach((i, k) => { const p = pose(f, i); vars += `;--a${k + 1}:${f1(p.a)}deg;--s${k + 1}:${f1(p.r / L)};--t${k + 1}:${f1(L - p.r)}px`; });
    const o = `style="transform-origin:${f1(bx)}px ${f1(by)}px"`, l = `M${f1(bx - 22)} ${f1(by + 12)}L${f1(bx - 17)} ${f1(by - L)}`, r = `M${f1(bx + 17)} ${f1(by - L)}L${f1(bx + 22)} ${f1(by + 12)}`;
    // a tapered body (fill), its two sides (stroke, no top edge) and a round tip over the end: a drawn finger
    const g = `<g class="fng${used.has(f) ? " fng--on" : ""}" style="${vars}"><path class="fbody" ${o} d="${l}L${f1(bx + 17)} ${f1(by - L)}L${f1(bx + 22)} ${f1(by + 12)}Z"/><path class="fbody fside" ${o} d="${l}${r}"/><circle class="ftip" cx="${f1(bx)}" cy="${f1(by - L)}" r="18"/></g>`;
    if (used.has(f)) active += g; else rest += g;
  }
  let keys = "";
  for (let r = 0; r < 3; r++) for (const c of cols) { const i = r * 10 + c; keys += `<g class="key"><rect class="cast" x="${kx(i) + 10}" y="${ky(i) + 10}" width="92" height="92"/><rect class="cap" x="${kx(i) + 4}" y="${ky(i) + 4}" width="92" height="92"/><text class="lbl" x="${cx(i)}" y="${cy(i) + 2}">${esc(WLD[i])}</text></g>`; }
  let hits = "";
  steps.forEach((i, k) => {
    const tag = h.costs ? cost(EFF[i]) : h.rest ? "" : String(k + 1);
    hits += `<g class="hit s${k + 1}"><rect class="on" x="${kx(i) + 4}" y="${ky(i) + 4}" width="92" height="92"/><text class="lbl" x="${cx(i)}" y="${cy(i) + 2}">${esc(WLD[i])}</text>${tag ? (h.costs ? `<text class="tag tag--low" x="${kx(i) + 12}" y="${ky(i) + 90}">${tag}</text>` : `<text class="tag" x="${kx(i) + 88}" y="${ky(i) + 30}">${tag}</text>`) : ""}</g>`;
  });
  const label = h.costs ? "the left index from its home key T to D and to Q, each key with its cost" : `the keys ${[...h.keys].join(", ")} on the ${right ? "right" : "left"} hand, struck in order`;
  return `<svg class="hand" viewBox="0 0 512 470" role="img" aria-label="${esc(h.name)}: ${esc(label)}">${keys}${hits}<g class="rest">${rest}</g>${active}</svg>`;
}
HABITS.find((h) => h.id === "travel").text = `What each key costs from the finger’s home: ${cost(EFF[coreOf("t")])} on t, ${cost(EFF[coreOf("d")])} for d, ${cost(EFF[coreOf("q")])} for q, averaged over every keystroke.`;
const habits = `<ol class="habits">${HABITS.map((h, n) => `<li class="habit" style="--i:${n}">${handSvg(h, n)}<div><h3>${esc(h.name)}</h3><p>${h.text}</p></div></li>`).join("\n")}</ol>`;

const tmpl = fs.readFileSync(here + "index.tmpl.html", "utf8");
fs.writeFileSync(here + "index.html", tmpl.replace("<!--BOARDS-->", boards).replace("<!--CANDIDATES-->", candidates).replace("<!--EFFORT-->", costMap()).replace("<!--ANNEAL-->", annealChart()).replace("<!--HABITS-->", habits));
console.log("index.html written,", SHOWN.length, "boards");
