# Toucan Trainer

Typing trainer for the custom Toucan2 layout. Shows the board (ZMK Studio style) with the next key, the key you pressed, and the layer inferred from what arrived (NAV for digits, SYM for symbols, ACC layers for accented letters).

Open `index.html` in Chrome (double-click works), or serve the folder: `python3 -m http.server 8765` then http://127.0.0.1:8765/.

`keymap.js` is generated from the firmware keymap (`firmware/config/toucan_dongle.keymap`):
`node gen.mjs <corpus_dir>` (corpus_dir = folder with local_en.txt / local_fr.txt and, if present, local_fr_restored.txt from layout-optimizer). Rerun after changing the keymap.

**Live feed.** `Live feed` connects the dongle's key-feed serial port (Chrome WebSerial, page must be on 127.0.0.1 or https).
The board then mirrors the real keyboard: keys light as they are pressed on either half, held layers and the sticky accent
layers show at once, and a wrong character marks the key you actually hit. The dongle has two serial ports with the same
name; the feed is the first one (lower ttyACM number). If nothing lights when you press a key, disconnect and pick the other.
The choice is remembered. The ports need
read/write access: `sudo chmod a+rw /dev/ttyACM*` or a udev rule for USB id 1d50:615e.

Without the feed the board is inferred from what the OS receives (works everywhere, but layers only show after the fact).

Accents need the OS on the US International layout, like the keyboard itself: the trainer then sees é arrive as AltGr+E and à as dead key + A, and credits the right keys.

## How the lessons work

Modelled on keybr / TypingClub rather than fixed drills:

- **Per-key skill.** Every key has a confidence = min(target speed ÷ your smoothed time for it, accuracy ÷ 95%), ramped in over the first 12 presses. `Mastery on board` paints it (red = new, green = at target). Pick the target speed in the toolbar (default 30 wpm).
- **Weak keys come up more.** Texts are real words from your own corpus, sampled so that a word made of weak keys is up to 4× as likely as one made of mastered keys. New letters in a lesson start at 0, so they dominate until they catch up.
- **Short loops.** 16 words per text (about 45 s). After each: stars (★ 95 %+ accuracy, ★★ 98 %+, ★★★ at target speed), personal best, the keys still below target.
- **Mastery gate.** Enter moves to the next lesson only once every key the lesson introduces is green; otherwise it serves another text. The lesson map shows best stars per lesson; `‹ lesson` / `lesson ›` or a click skips freely.
- **The board fades key by key.** While a key is new it keeps its label and lights up at once. Once you know it (confidence 0.7) its label disappears from the board and the highlight plus finger hint come only after a 1 s hesitation, so you recall first and read second. `Hints` cycles auto → always (full labels) → board hidden.
- **Streak and history.** Days practised in a row, minutes today, and a sparkline of speed for the current lesson or mode.

Everything is stored in the browser (localStorage: keys, stars, streak, history, error heat map).

`node selftest.mjs` drives the page in headless Chrome through a few lessons and checks the gate, the hint fading and every text generator.
