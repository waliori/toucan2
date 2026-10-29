# Walid layout trainer

Typing trainer for the Walid layout (WLD) on the Toucan2. Shows the board (ZMK Studio style) with the next key, the key you pressed, and the layer inferred from what arrived (NAV for digits, SYM for symbols, ACC layers for accented letters).

Open `index.html` in Chrome (double-click works), or serve the folder: `python3 -m http.server 8765` then http://127.0.0.1:8765/.

Hosted copy: https://toucan-trainer.waliori.workers.dev (Cloudflare Worker, static assets + the sync endpoint below).
Deploy a new version with `npx wrangler@latest deploy` from this folder (one-time `npx wrangler@latest login`; `.assetsignore`
keeps the dev files off the site).

## Sync between devices

Progress lives in the browser (`localStorage`, every `toucan.*` key). **Sync** in Settings → Devices shows a secret
32-hex code, as text and as a QR of the link `…/#sync=<code>`: scan it with the phone, open the link on the other machine
(the page reads the code and drops it from the address bar), or paste the code there. From then on each finished text (and
closing the tab) uploads the whole state as one JSON blob to `/p/<code>`, and opening the page **merges** the server copy
with the device's own: histories are joined by timestamp, each key, pair, day, star and heat count keeps the higher value,
the lesson is the furthest reached, plain settings come from the side saved last. Two devices practising in turn therefore
lose nothing; only two devices typing at the same second can still overwrite each other. Anyone with the code or the link
can read or overwrite your stats, nothing else: keep it in a password manager, there is no account and no recovery.
Storage is one Cloudflare KV namespace (`worker.mjs`, `wrangler.toml`); the local `python3 -m http.server` copy simply has
no sync. The QR encoder is `qr.js` (byte mode, level L, versions 1-9, no dependency).

## The screen

One row of chrome: the mode menu (Learn / Practice / Challenge, also Ctrl+↑/↓), the Stats drawer and a Settings panel
(Ctrl+,) that holds everything else: keyboard on/off, key colouring, hints, layout, target speed, click sound, theme
(auto, dark, light), sync and the live feed. Below it: the lesson track, the title line with live wpm, accuracy and time,
the text, the hint, and the board. While you type the chrome fades out; moving the mouse brings it back. After a text the
result replaces the hint: speed, accuracy, stars, personal best, keys still below target, missed words, and the Enter /
Esc buttons.

## How the lessons work

Modelled on keybr / TypingClub rather than fixed drills:

- **Target speed.** In Settings, the slider goes from 15 to 150 wpm and the number next to it accepts any value. Everything below (mastery, stars, burst pace) follows it.
- **Per-key skill.** Every key has a confidence = min(target speed ÷ your smoothed time for it, accuracy ÷ 95%), ramped in over the first 12 presses. `Mastery on board` paints it (red = new, green = at target). Pick the target speed in the toolbar (default 30 wpm).
- **Weak keys come up more.** Texts are real words from your own corpus, sampled so that a word made of weak keys is up to 4× as likely as one made of mastered keys. New letters in a lesson start at 0, so they dominate until they catch up.
- **Short loops.** 16 words per text (about 45 s). After each: stars (★ 95 %+ accuracy, ★★ 98 %+, ★★★ at target speed), personal best, the keys still below target.
- **Mastery gate.** Enter moves to the next lesson only once every key the lesson introduces is green; otherwise it serves another text. The lesson map shows best stars per lesson; `‹ lesson` / `lesson ›` or a click skips freely.
- **The board fades key by key.** While a key is new it keeps its label and lights up at once. Once you know it (confidence 0.7) its label disappears from the board and the highlight plus finger hint come only after a 1 s hesitation, so you recall first and read second. `Hints` switches auto ↔ always (full labels); `Board` (Ctrl+B) hides the keyboard entirely.
- **Warm-up.** The first time a lesson introduces keys you have never typed, the text is just those keys, three times each, so you find them before words start.
- **Modes beyond the lessons.** *Chunks*: the letter groups you type most ("tion", "ment", "ing", "eau"…), mined from your own word lists, English and French mixed; each text drills six of them, three times alone then inside real words, and groups that contain your slow letter pairs come up more often. *Sentences*: real sentences in both languages with capitals, punctuation and accents. *Weak pairs*: words built from your eight slowest letter pairs (measured on every text). *Speed burst*: 30 s against a target 10 wpm above yours. *Your text*: anything pasted.
- **After each text** you get stars, the keys still below target, every missed word with what you pressed for what (and which key, when the board knew), and a count of capitals typed with the same-hand Shift.
- **The clock ignores breaks.** Any gap over 5 s between two keys counts as 5 s, so a tab switch does not wreck the speed.
- **Stats** (Ctrl+I) open in a side drawer with four tabs: Overview, Keys, Letter pairs, Practice. Interactive charts, hover anything for the numbers. Speed and accuracy text by text with a 10-text average, filterable by mode, by period, and by lesson (all lessons together or one at a time); a practice calendar; the board coloured by mastery, speed, accuracy or errors; a letter-pair matrix; finger load; weakest keys; lesson stars. Export / import of the progress file lives at the bottom.
- **Other layouts.** The layout menu puts QWERTY, Colemak-DH, Graphite, Gallium, Canary, Sturdy, Ergo-L or the firmware's GAME layer (QWERTY with 1-3 on the inner column; its thumb digits 4-5 are outside the 30 core keys) on the 30 core keys (lessons are then generated from the layout: home row, then letters by frequency). Thumbs, modifiers and the NAV/SYM/accent layers stay as the firmware has them. Stats are per character, so switching mixes them.
- **Shortcuts.** Tab or Esc: new text. Ctrl+←/→: lesson. Ctrl+↑/↓: mode. Ctrl+B: board. Ctrl+I: stats. The address bar always holds a link to the current view (`?mode=lesson&lesson=3`), so a lesson can be shared.
- **Sound** adds a short click on mistakes, off by default. The page follows the system light/dark preference.
- **Streak and history.** Days practised in a row, minutes today, and a sparkline of speed for the current lesson or mode.

Everything is stored in the browser (localStorage: keys, stars, streak, history, error heat map).

`node selftest.mjs` drives the page in headless Chrome through a few lessons and checks the gate, the hint fading and every text generator.
