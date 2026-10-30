// A user's own keymap, from keymap-drawer's YAML (`keymap parse -z your.keymap`), turned into the trainer's layer model.
// YAML subset: what keymap-drawer writes and what people write by hand for it (block and flow lists, {t:, h:, s:, type:}
// mappings, quoted scalars). Anything else in the file (layout, combos, draw_config) is read and ignored.
(function (root) {
  function parseYaml(text) {
    const lines = text.replace(/\r/g, "").split("\n").filter((l) => !/^\s*#/.test(l) && l.trim() !== "" && l.trim() !== "---");
    let i = 0;
    const indent = (l) => l.match(/^ */)[0].length;
    // ---- flow scalars and collections ----
    function parseFlow(s) {
      let p = 0;
      const ws = () => { while (p < s.length && /\s/.test(s[p])) p++; };
      const fail = (what) => { throw new Error(`${what} near "${s.slice(Math.max(0, p - 10), p + 20)}"`); };
      function scalar(inFlow, isKey) {
        ws(); const c = s[p];
        if (c === "'") { p++; let o = ""; for (;;) { if (p >= s.length) fail("unclosed quote"); if (s[p] === "'") { if (s[p + 1] === "'") { o += "'"; p += 2; continue; } p++; return o; } o += s[p++]; } }
        if (c === '"') { p++; let o = ""; for (;;) { if (p >= s.length) fail("unclosed quote"); if (s[p] === '"') { p++; return o; } if (s[p] === "\\") { const n = s[p + 1]; p += 2; if (n === "u") { o += String.fromCharCode(parseInt(s.slice(p, p + 4), 16)); p += 4; } else o += ({ n: "\n", t: "\t", "0": "\0" })[n] ?? n; continue; } o += s[p++]; } }
        let o = "";
        while (p < s.length) { const ch = s[p]; if (inFlow && (ch === "," || ch === "]" || ch === "}")) break; if (isKey && ch === ":" && /\s/.test(s[p + 1] || " ")) break; o += ch; p++; }
        return o.trim();
      }
      function value(inFlow) {
        ws(); const c = s[p];
        if (c === "[") { p++; const a = []; ws(); if (s[p] === "]") { p++; return a; } for (;;) { a.push(value(true)); ws(); if (s[p] === ",") { p++; ws(); if (s[p] === "]") { p++; return a; } continue; } if (s[p] === "]") { p++; return a; } fail("expected , or ]"); } }
        if (c === "{") { p++; const o = {}; ws(); if (s[p] === "}") { p++; return o; } for (;;) { const k = scalar(true, true); ws(); if (s[p] !== ":") fail("expected :"); p++; o[k] = value(true); ws(); if (s[p] === ",") { p++; ws(); if (s[p] === "}") { p++; return o; } continue; } if (s[p] === "}") { p++; return o; } fail("expected , or }"); } }
        return scalar(inFlow, false);
      }
      const v = value(false); ws(); if (p < s.length) fail("unexpected text"); return v;
    }
    const balanced = (s) => { let d = 0, q = null; for (const ch of s) { if (q) { if (ch === q) q = null; continue; } if (ch === "'" || ch === '"') q = ch; else if (ch === "[" || ch === "{") d++; else if (ch === "]" || ch === "}") d--; } return d <= 0 && !q; };
    function inlineValue(rest) {   // a flow collection may run over several lines; a scalar ends with the line
      let s = rest; while (!balanced(s) && i < lines.length) s += " " + lines[i++].trim();
      return parseFlow(s);
    }
    // ---- block structure ----
    function block(ind) {
      if (i >= lines.length) return null;
      const l = lines[i]; if (indent(l) < ind) return null;
      return /^\s*- /.test(l) || /^\s*-$/.test(l) ? sequence(indent(l)) : mapping(indent(l));
    }
    function mapping(ind) {
      const o = {};
      while (i < lines.length && indent(lines[i]) === ind && !/^\s*- /.test(lines[i])) {
        const m = /^\s*(?:'((?:[^']|'')*)'|"([^"]*)"|([^:]+?))\s*:(?:\s+(.*))?$/.exec(lines[i]); if (!m) throw new Error(`cannot read line: ${lines[i].trim()}`);
        const key = m[1] !== undefined ? m[1].replace(/''/g, "'") : m[2] !== undefined ? m[2] : m[3].trim(); i++;
        if (m[4] !== undefined && m[4].trim() !== "") o[key] = inlineValue(m[4]);
        else if (i < lines.length && (indent(lines[i]) > ind || (indent(lines[i]) === ind && /^\s*- /.test(lines[i])))) o[key] = block(indent(lines[i]));
        else o[key] = null;
      }
      return o;
    }
    function sequence(ind) {
      const a = [];
      while (i < lines.length && indent(lines[i]) === ind && /^\s*-( |$)/.test(lines[i])) {
        const rest = lines[i].replace(/^\s*-\s?/, ""); i++;
        if (rest === "") a.push(block(indent(lines[i] || "")));
        else if (/^-( |$)/.test(rest)) { lines.splice(i, 0, " ".repeat(ind + 2) + rest); a.push(sequence(ind + 2)); }   // "- - a": a row written as a nested block list
        else if (/^[\[{]/.test(rest)) a.push(inlineValue(rest));
        else if (/^[^'"\[{][^:]*?:\s+\S/.test(rest) || /^[^'"\[{][^:]*?:$/.test(rest)) {   // "- t: X" starts a block mapping continued on the next, deeper lines
          const first = `${" ".repeat(ind + 2)}${rest}`; lines.splice(i, 0, first); const o = mapping(ind + 2); a.push(o);
        } else a.push(parseFlow(rest));
      }
      return a;
    }
    const doc = block(0);
    if (!doc || typeof doc !== "object" || Array.isArray(doc)) throw new Error("expected a mapping with a layers: key at the top level");
    return doc;
  }

  // ---- legends -> the trainer's keys ----
  const NAMED = { TAB: ["Tab", "Tab", "\t"], BSPC: ["Backspace", "BkSp"], BACKSPACE: ["Backspace", "BkSp"], ESC: ["Escape", "Esc"], ESCAPE: ["Escape", "Esc"], RET: ["Enter", "Ret", "\n"], ENTER: ["Enter", "Ret", "\n"], RETURN: ["Enter", "Ret", "\n"],
    SPACE: ["Space", "␣", " "], DEL: ["Delete", "Del"], DELETE: ["Delete", "Del"], INS: ["Insert", "Ins"], HOME: ["Home", "Home"], END: ["End", "End"], PG_UP: ["PageUp", "PgUp"], PAGE_UP: ["PageUp", "PgUp"], PG_DN: ["PageDown", "PgDn"], PAGE_DOWN: ["PageDown", "PgDn"],
    LEFT: ["ArrowLeft", "←"], RIGHT: ["ArrowRight", "→"], UP: ["ArrowUp", "↑"], DOWN: ["ArrowDown", "↓"], CAPS: ["CapsLock", "Caps"], CAPSLOCK: ["CapsLock", "Caps"],
    LCTRL: ["ControlLeft", "Ctrl"], LSHFT: ["ShiftLeft", "Shift"], LSHIFT: ["ShiftLeft", "Shift"], LALT: ["AltLeft", "Alt"], LGUI: ["MetaLeft", "Super"], LCMD: ["MetaLeft", "Super"], LWIN: ["MetaLeft", "Super"],
    RCTRL: ["ControlRight", "Ctrl"], RSHFT: ["ShiftRight", "Shift"], RSHIFT: ["ShiftRight", "Shift"], RALT: ["AltRight", "AltGr"], RGUI: ["MetaRight", "Super"], RCMD: ["MetaRight", "Super"], RWIN: ["MetaRight", "Super"],
    SFT: ["ShiftLeft", "Shift"], CTL: ["ControlLeft", "Ctrl"], ALT: ["AltLeft", "Alt"], GUI: ["MetaLeft", "Super"], ALTGR: ["AltRight", "AltGr"] };
  for (let n = 1; n <= 12; n++) NAMED["F" + n] = ["F" + n, "F" + n];
  const BASE = { "-": "Minus", "=": "Equal", "[": "BracketLeft", "]": "BracketRight", "\\": "Backslash", ";": "Semicolon", "'": "Quote", "`": "Backquote", ",": "Comma", ".": "Period", "/": "Slash" };
  const SHIFTED = { _: "-", "+": "=", "{": "[", "}": "]", "|": "\\", ":": ";", '"': "'", "~": "`", "<": ",", ">": ".", "?": "/", "!": "1", "@": "2", "#": "3", $: "4", "%": "5", "^": "6", "&": "7", "*": "8", "(": "9", ")": "0" };
  const ALTGR = { e: "é", a: "á", i: "í", o: "ó", u: "ú", y: "ü", p: "ö", q: "ä", w: "å", s: "ß", n: "ñ", c: "©", ",": "ç", "5": "€", "[": "«", "]": "»" };   // US-International
  const MACRO_CHAR = { apos: "'", apostrophe: "'", sqt: "'", quote: "'", dquot: '"', dquote: '"', dqt: '"', caret: "^", grave: "`", tilde: "~", bslh: "\\", backslash: "\\" };
  const codeOfChar = (c) => /^[a-z]$/.test(c) ? "Key" + c.toUpperCase() : /^\d$/.test(c) ? "Digit" + c : BASE[c];
  function legend(t) {
    if (t === "" || t == null) return { kind: "other", label: "" };
    t = String(t);
    if (/^&[A-Za-z_]/.test(t)) {   // a macro or behaviour of theirs: shown by name; a few common names for a plain character are read as that character
      const nm = t.slice(1).split(" ")[0], ch = MACRO_CHAR[nm.toLowerCase()];
      return ch ? legend(ch) : { kind: "other", label: nm };
    }
    const m = /^((?:Sft|Ctl|Alt|AltGr|Gui|Hyper|Meh)(?:\+(?:Sft|Ctl|Alt|AltGr|Gui))*)\+(.+)$/.exec(t);
    if (m) {
      const mods = m[1].split("+"), base = legend(m[2]);
      if (base.kind === "key" && base.char && mods.every((x) => x === "Sft")) { const up = SHIFTED_OF[base.char] ?? base.char.toUpperCase(); return { kind: "key", code: base.code, label: up, char: up, shift: true }; }
      if (base.kind === "key" && base.char && mods.every((x) => x === "AltGr" || x === "Sft") && ALTGR[base.char]) { let c = ALTGR[base.char]; if (mods.includes("Sft")) c = c.toUpperCase(); return { kind: "key", code: base.code, label: c, char: c, altgr: true }; }
      return { kind: "other", label: t };
    }
    const name = t.toUpperCase().replace(/ /g, "_");
    if (NAMED[name]) { const [code, label, ch] = NAMED[name]; return ch !== undefined ? { kind: "key", code, label, char: ch } : { kind: "key", code, label }; }
    if (/^N\d$/.test(name)) t = name[1];
    if ([...t].length === 1) {
      if (/^\p{L}$/u.test(t)) { const low = t.toLowerCase(); return { kind: "key", code: codeOfChar(low), label: t.toUpperCase(), char: low }; }
      if (/^\d$/.test(t) || BASE[t]) return { kind: "key", code: codeOfChar(t), label: t, char: t };
      if (SHIFTED[t]) return { kind: "key", code: codeOfChar(SHIFTED[t]), label: t, char: t, shift: true };
      return { kind: "key", label: t, char: t };   // any other single character (an accented letter from a macro the user named by its output)
    }
    return { kind: "other", label: t };
  }
  const SHIFTED_OF = Object.fromEntries(Object.entries(SHIFTED).map(([s, b]) => [b, s]));
  const MOD_HOLD = /^(LCTRL|RCTRL|LSHFT|RSHFT|LSHIFT|RSHIFT|LALT|RALT|LGUI|RGUI|LCMD|RCMD|LWIN|RWIN|CTL|SFT|ALT|GUI|ALTGR)$/;
  function keyOf(spec, names) {
    if (spec == null || typeof spec !== "object") spec = { t: spec == null ? "" : String(spec) };
    const t = String(spec.t ?? spec.tap ?? spec.center ?? ""), h = String(spec.h ?? spec.hold ?? spec.bottom ?? ""), type = String(spec.type ?? "");
    if (/\bheld\b/.test(type)) return { kind: "trans", label: "" };   // the key held to be on this layer
    if (/\btrans\b/.test(type) || t === "▽") return { kind: "trans", label: "" };
    const li = names.indexOf(t);
    if (li >= 0) {   // a layer legend: hold (mo), toggle, sticky, or a hold-tap with the layer on tap and a modifier on hold
      if (h === "toggle") return { kind: "layer", layer: li, label: t, toggle: true };
      if (h === "sticky") return { kind: "sticky", layer: li, label: t };
      const hn = h.toUpperCase().replace(/ /g, "_"); if (MOD_HOLD.test(hn) && NAMED[hn]) return { kind: "key", code: NAMED[hn][0], label: NAMED[hn][1], tap: { kind: "sticky", layer: li } };
      return { kind: "layer", layer: li, label: t };
    }
    const k = legend(t); const hi = names.indexOf(h); if (hi >= 0) k.hold = hi;   // layer-tap: types t, holds the layer
    return k;
  }
  // 36-key boards (3x5+3 a side) drop the Toucan2's outer columns: place them on the same 42 positions
  const POS36 = [...Array(30).keys()].map((i) => Math.floor(i / 10) * 12 + 1 + (i % 10)).concat([36, 37, 38, 39, 40, 41]);
  function toLayers(doc) {
    const L = doc && doc.layers;
    if (!L || typeof L !== "object" || Array.isArray(L)) throw new Error("no layers: section found");
    const names = Object.keys(L); if (!names.length) throw new Error("layers: is empty");
    const flat = (v) => Array.isArray(v) ? v.flatMap(flat) : [v];
    const layers = names.map((name, id) => {
      const items = flat(L[name] ?? []);
      let keys;
      if (items.length === 42) keys = items.map((s) => keyOf(s, names));
      else if (items.length === 36) { keys = Array.from({ length: 42 }, () => ({ kind: "other", label: "" })); items.forEach((s, i) => { keys[POS36[i]] = keyOf(s, names); }); }
      else throw new Error(`layer "${name}" has ${items.length} keys; the Toucan2 has 42 (or 36 without the outer columns)`);
      return { id, name, keys };
    });
    layers.forEach((M) => { if (layers.some((N) => N.keys.some((k) => k.toggle && k.layer === M.id))) M.locked = true; });   // toggle-only layers (a game layer) are not a way to type
    const letters = layers[0].keys.filter((k) => k.kind === "key" && k.char && /\p{L}/u.test(k.char)).length;
    if (letters < 20) throw new Error(`the first layer has only ${letters} letters; the first layer must be the one you type with`);
    return layers;
  }
  const api = { parseYaml, toLayers, fromYaml: (text) => toLayers(parseYaml(text)) };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.KMYAML = api;
})(typeof window !== "undefined" ? window : globalThis);
