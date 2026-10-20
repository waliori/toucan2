// Generates keymap.js for the trainer from the firmware keymap (+ word lists from the corpus).
// Usage: node gen.mjs [corpus_dir]   (corpus_dir holds local_en.txt / local_fr.txt / local_fr_restored.txt)
import fs from "node:fs";

const KEYMAP = new URL("../firmware/config/toucan_dongle.keymap", import.meta.url);
const src = fs.readFileSync(KEYMAP, "utf8");

// physical layout from toucan.dtsi (w h x y rot rx ry), 42 keys
const PHYS = `
100 100 0 37 0 0 0|100 100 100 37 0 0 0|100 100 200 12 0 0 0|100 100 300 0 0 0 0|100 100 400 12 0 0 0|100 100 500 24 0 0 0|100 100 800 24 0 0 0|100 100 900 12 0 0 0|100 100 1000 0 0 0 0|100 100 1100 12 0 0 0|100 100 1200 37 0 0 0|100 100 1300 37 0 0 0
100 100 0 137 0 0 0|100 100 100 137 0 0 0|100 100 200 112 0 0 0|100 100 300 100 0 0 0|100 100 400 112 0 0 0|100 100 500 124 0 0 0|100 100 800 124 0 0 0|100 100 900 112 0 0 0|100 100 1000 100 0 0 0|100 100 1100 112 0 0 0|100 100 1200 137 0 0 0|100 100 1300 137 0 0 0
100 100 0 237 0 0 0|100 100 100 237 0 0 0|100 100 200 212 0 0 0|100 100 300 200 0 0 0|100 100 400 212 0 0 0|100 100 500 224 0 0 0|100 100 800 224 0 0 0|100 100 900 212 0 0 0|100 100 1000 200 0 0 0|100 100 1100 212 0 0 0|100 100 1200 237 0 0 0|100 100 1300 237 0 0 0
100 100 350 312 0 0 0|100 100 450 312 1200 450 412|100 100 548 328 2400 548 433|100 100 752 328 -2400 852 433|100 100 850 312 -1200 950 412|100 100 950 312 0 0 0
`.trim().split(/\n|\|/).map((s) => { const [w, h, x, y, r, rx, ry] = s.trim().split(/\s+/).map(Number); return { w, h, x, y, r: r / 100, rx, ry }; });

// HID keyboard usage -> [event.code, label, char, shiftedChar]
const HID = {
  0x04:["KeyA","A","a"],0x05:["KeyB","B","b"],0x06:["KeyC","C","c"],0x07:["KeyD","D","d"],0x08:["KeyE","E","e"],0x09:["KeyF","F","f"],0x0a:["KeyG","G","g"],0x0b:["KeyH","H","h"],
  0x0c:["KeyI","I","i"],0x0d:["KeyJ","J","j"],0x0e:["KeyK","K","k"],0x0f:["KeyL","L","l"],0x10:["KeyM","M","m"],0x11:["KeyN","N","n"],0x12:["KeyO","O","o"],0x13:["KeyP","P","p"],
  0x14:["KeyQ","Q","q"],0x15:["KeyR","R","r"],0x16:["KeyS","S","s"],0x17:["KeyT","T","t"],0x18:["KeyU","U","u"],0x19:["KeyV","V","v"],0x1a:["KeyW","W","w"],0x1b:["KeyX","X","x"],0x1c:["KeyY","Y","y"],0x1d:["KeyZ","Z","z"],
  0x1e:["Digit1","1","1","!"],0x1f:["Digit2","2","2","@"],0x20:["Digit3","3","3","#"],0x21:["Digit4","4","4","$"],0x22:["Digit5","5","5","%"],0x23:["Digit6","6","6","^"],0x24:["Digit7","7","7","&"],0x25:["Digit8","8","8","*"],0x26:["Digit9","9","9","("],0x27:["Digit0","0","0",")"],
  0x28:["Enter","Ret","\n"],0x29:["Escape","Esc"],0x2a:["Backspace","BkSp"],0x2b:["Tab","Tab","\t"],0x2c:["Space","␣"," "],0x2d:["Minus","-","-","_"],0x2e:["Equal","=","=","+"],0x2f:["BracketLeft","[","[","{"],0x30:["BracketRight","]","]","}"],0x31:["Backslash","\\","\\","|"],
  0x33:["Semicolon",";",";",":"],0x34:["Quote","'","'",'"'],0x35:["Backquote","`","`","~"],0x36:["Comma",",",",","<"],0x37:["Period",".",".",">"],0x38:["Slash","/","/","?"],0x39:["CapsLock","Caps"],
  0x3a:["F1","F1"],0x3b:["F2","F2"],0x3c:["F3","F3"],0x3d:["F4","F4"],0x3e:["F5","F5"],0x3f:["F6","F6"],0x40:["F7","F7"],0x41:["F8","F8"],0x42:["F9","F9"],0x43:["F10","F10"],0x44:["F11","F11"],0x45:["F12","F12"],
  0x49:["Insert","Ins"],0x4a:["Home","Home"],0x4b:["PageUp","PgUp"],0x4c:["Delete","Del"],0x4d:["End","End"],0x4e:["PageDown","PgDn"],0x4f:["ArrowRight","→"],0x50:["ArrowLeft","←"],0x51:["ArrowDown","↓"],0x52:["ArrowUp","↑"],
  0xe0:["ControlLeft","Ctrl"],0xe1:["ShiftLeft","Shift"],0xe2:["AltLeft","Alt"],0xe3:["MetaLeft","Super"],0xe4:["ControlRight","Ctrl"],0xe5:["ShiftRight","Shift"],0xe6:["AltRight","AltGr"],0xe7:["MetaRight","Super"],
};
const CONS = { 0xea:["AudioVolumeDown","Vol−"],0xe2:["AudioVolumeMute","Mute"],0xe9:["AudioVolumeUp","Vol+"],0xcd:["MediaPlayPause","Play"],0xb5:["MediaTrackNext","Next"],0xb6:["MediaTrackPrevious","Prev"],0x6f:["BrightnessUp","Bri+"],0x70:["BrightnessDown","Bri−"] };

// ZMK key names -> HID usage
const KEYS = { TAB:0x2b, BSPC:0x2a, ESC:0x29, RET:0x28, ENTER:0x28, SPACE:0x2c, MINUS:0x2d, EQUAL:0x2e, LBKT:0x2f, RBKT:0x30, BSLH:0x31, SEMI:0x33, SQT:0x34, GRAVE:0x35, COMMA:0x36, DOT:0x37, FSLH:0x38, CAPS:0x39,
  INS:0x49, HOME:0x4a, PG_UP:0x4b, DEL:0x4c, END:0x4d, PG_DN:0x4e, RIGHT:0x4f, LEFT:0x50, DOWN:0x51, UP:0x52, LCTRL:0xe0, LSHFT:0xe1, LALT:0xe2, LGUI:0xe3, RCTRL:0xe4, RSHFT:0xe5, RALT:0xe6, RGUI:0xe7 };
for (let i = 0; i < 26; i++) KEYS[String.fromCharCode(65 + i)] = 0x04 + i;
"1234567890".split("").forEach((d, i) => { KEYS["N" + d] = 0x1e + i; });
for (let i = 1; i <= 12; i++) KEYS["F" + i] = 0x3a + i - 1;
const SHIFTED = { EXCL:"N1", AT:"N2", HASH:"N3", DLLR:"N4", PRCNT:"N5", CARET:"N6", AMPS:"N7", STAR:"N8", LPAR:"N9", RPAR:"N0", UNDER:"MINUS", PLUS:"EQUAL", LBRC:"LBKT", RBRC:"RBKT", PIPE:"BSLH", COLON:"SEMI", DQT:"SQT", TILDE:"GRAVE", LT:"COMMA", GT:"DOT", QMARK:"FSLH" };
const CONSUMER = { C_VOL_DN:0xea, C_MUTE:0xe2, C_VOL_UP:0xe9, C_PP:0xcd, C_NEXT:0xb5, C_PREV:0xb6, C_BRI_UP:0x6f, C_BRI_DN:0x70 };
// US-International AltGr characters (same on Linux us(intl) and Windows)
const ALTGR = { E:"é", A:"á", I:"í", O:"ó", U:"ú", Y:"ü", P:"ö", Q:"ä", W:"å", S:"ß", N:"ñ", C:"©", COMMA:"ç", N5:"€", LBKT:"«", RBKT:"»" };

function parseKey(expr) {               // "LS(RA(E))" -> { name, shift, altgr, ctrl, gui }
  const mods = { shift: false, altgr: false, ctrl: false, gui: false };
  let m; while ((m = /^(LS|RS|RA|LA|LC|RC|LG|RG)\((.*)\)$/.exec(expr))) { ({ LS: "shift", RS: "shift", RA: "altgr", LA: "altgr", LC: "ctrl", RC: "ctrl", LG: "gui", RG: "gui" })[m[1]] && (mods[({ LS: "shift", RS: "shift", RA: "altgr", LA: "altgr", LC: "ctrl", RC: "ctrl", LG: "gui", RG: "gui" })[m[1]]] = true); expr = m[2]; }
  if (SHIFTED[expr]) { mods.shift = true; expr = SHIFTED[expr]; }
  return { name: expr, ...mods };
}
function decodeKp(expr) {
  const k = parseKey(expr);
  if (CONSUMER[k.name] !== undefined) { const c = CONS[CONSUMER[k.name]]; return { kind: "key", code: c[0], label: c[1] }; }
  const usage = KEYS[k.name]; if (usage === undefined) throw new Error("unknown key " + expr);
  const [code, label, ch, sch] = HID[usage];
  if (k.altgr) { let c = ALTGR[k.name] || "?"; if (k.shift) c = c.toUpperCase(); return { kind: "key", code, label: c, char: c, altgr: true }; }
  if (k.shift) return { kind: "key", code, label: sch ?? label, char: sch, shift: true };
  return { kind: "key", code, label, char: ch };
}
const codeOf = (expr) => HID[KEYS[parseKey(expr).name]][0];

// keymap-defined names: #define N, PLAIN(name, dk, text), DEAD(name, dk, letter, text)
const defs = {}; for (const m of src.matchAll(/^#define\s+(\w+)\s+(\d+)\s*$/gm)) defs[m[1]] = Number(m[2]);
const num = (t) => (t in defs ? defs[t] : Number(t));
const plain = {}; for (const m of src.matchAll(/^\s*PLAIN\((\w+),\s*([^,]+),\s*"((?:[^"\\]|\\.)*)"\)/gm)) plain[m[1]] = { dk: m[2].trim(), text: JSON.parse('"' + m[3] + '"') };
const COMBINING = { GRAVE: "̀", "LS(N6)": "̂", "LS(SQT)": "̈", "LS(GRAVE)": "̃", SQT: "́" };
const dead = {}; for (const m of src.matchAll(/^\s*DEAD\((\w+),\s*([^,]+),\s*(\w+),/gm)) dead[m[1]] = { dk: m[2].trim(), letter: m[3] };

const LAYER_NAMES = [];
function decode(tok) {
  const [b, ...p] = tok;
  switch (b) {
    case "trans": return { kind: "trans", label: "" };
    case "kp": return decodeKp(p[0]);
    case "mo": return { kind: "layer", layer: num(p[0]), label: LAYER_NAMES[num(p[0])] || ("L" + p[0]) };
    case "slx": case "sl": return { kind: "sticky", layer: num(p[0]), label: "ACC" + (num(p[0]) - defs.AC1 + 1) };
    case "ctl_acc": return { ...decodeKp(p[0]), tap: { kind: "sticky", layer: num(p[1]) } };
    case "studio_unlock": return { kind: "unlock", label: "Unlock" };
    case "caps_word": return { kind: "capsword", label: "Caps W" };
    case "bt": return { kind: "bt", label: p[0] === "BT_SEL" ? "BT" + p[1] : p[0] === "BT_CLR" ? "BT clr" : "BT" };
    case "out": return { kind: "out", label: "USB/BLE" };
    case "mkp": return { kind: "mouse", label: { LCLK: "LClk", RCLK: "RClk", MCLK: "MClk" }[p[0]] || "Clk" };
    case "bootloader": return { kind: "other", label: "BOOT" };
    case "sys_reset": return { kind: "other", label: "RESET" };
  }
  if (plain[b]) { const k = decodeKp(plain[b].dk); return { ...k, plain: true }; }   // dead key + space: same character as the plain key
  if (dead[b]) { const { dk, letter } = dead[b]; const ch = (letter.toLowerCase() + (COMBINING[dk] || "")).normalize("NFC"); return { kind: "key", code: codeOf(letter), label: ch, char: ch, dead: codeOf(dk) }; }
  throw new Error("unknown behavior &" + tok.join(" "));
}

const km = src.slice(src.indexOf("keymap {"));
const layerSrc = [...km.matchAll(/(\w+)\s*\{\s*display-name\s*=\s*"([^"]*)";\s*bindings\s*=\s*<([\s\S]*?)>;/g)];
layerSrc.forEach((m, i) => { LAYER_NAMES[i] = m[2]; });
const layers = layerSrc.map((m, id) => {
  const keys = m[3].split("&").slice(1).map((s) => decode(s.trim().split(/\s+/)));
  if (keys.length !== 42) throw new Error(`layer ${m[2]} has ${keys.length} keys`);
  return { id, name: m[2], keys };
});

// word lists from the corpus (by frequency). French uses the accent-restored file when present.
const corpusDir = process.argv[2];
const words = { en: [], fr: [], fr_acc: [] };
const listFrom = (file, re, min, n, filter = () => true) => {
  if (!corpusDir || !fs.existsSync(`${corpusDir}/${file}`)) return [];
  const txt = fs.readFileSync(`${corpusDir}/${file}`, "utf8").toLowerCase();
  const cnt = new Map(); for (const w of txt.match(re) || []) if (w.length <= 14 && filter(w)) cnt.set(w, (cnt.get(w) || 0) + 1);
  return [...cnt.entries()].filter(([, c]) => c >= min).sort((a, b) => b[1] - a[1]).slice(0, n).map(([w]) => w);
};
words.en = listFrom("local_en.txt", /[a-z]{2,}/g, 3, 2500);
const frFile = fs.existsSync(`${corpusDir}/local_fr_restored.txt`) ? "local_fr_restored.txt" : "local_fr.txt";
words.fr = listFrom(frFile, /[a-zàâçéèêëîïôùûü]{2,}/g, 3, 2500);
words.fr_acc = listFrom(frFile, /[a-zàâçéèêëîïôùûü]+/g, 2, 500, (w) => /[àâçéèêëîïôùûü]/.test(w));
fs.writeFileSync(new URL("./keymap.js", import.meta.url), "window.TOUCAN = " + JSON.stringify({ phys: PHYS, layers, words }) + ";\n");
console.log("keymap.js written:", layers.map((l) => l.name).join(" "), "; words en", words.en.length, "fr", words.fr.length, "fr_acc", words.fr_acc.length);
