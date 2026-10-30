# Toucan2 — the Walid layout (WLD), firmware and trainer

One repo for everything around my beekeeb Toucan2, a split keyboard in two wireless halves. The left half is the central: the one that talks to the computer and to the right half. The Prospector is a small screen that shows the keyboard's status. The site https://toucan.walior.it/ tells the story in plain words; the folders below hold the work.

Pipeline, in the order it was built:

1. `layout-optimizer/` — my own chat messages become a corpus (a big sample of what I type), an analyzer counts how comfortable a given arrangement of letters is on that text, and simulated annealing (a search that tries millions of letter swaps, keeping the good ones and, early on, some bad ones so it does not get stuck) finds the Walid layout (`custom_free_v2.json`).
2. `studio-rpc/` — scripts that talk to the keyboard over USB with the ZMK Studio protocol: apply, verify or reset the keymap without flashing new firmware.
3. `firmware/` — the program that runs on the two halves (ZMK v0.3, built with zmk-nix): the keymap (what each key does, the source of truth), the accent layers, the live key feed (each key press reported over USB so the trainer can light it up) and the status broadcast the Prospector listens to. `scanner/` — the Prospector's own firmware (ZMK main): it only listens and shows the layer, both batteries, the modifiers and the Bluetooth profile. The older setup where the Prospector was the keyboard's brain (a dongle) is kept under the git tag `dongle-central`.
4. `trainer/` — a typing trainer in the browser, generated from the firmware keymap. It tracks every key separately (how fast and how accurately you type it), draws the board, and can mirror the real key presses over USB. Hosted at https://toucan.walior.it/trainer/; progress follows you between devices through a secret code (stored in Cloudflare KV, no account).

## The name

The layout is called **Walid**, short mark **WLD** (the layer name on the Prospector, the nice!view and in the trainer). Tagline:
*Walid's Annealed Layout with International Dead-keys*: letter positions found by simulated annealing (see folder 1), French accents typed
through US-International dead keys (a dead key waits for the next letter and puts the accent on it: Ctrl tap, then e, gives é). The letters w, l, d sit in order on the top row, and typing "walid" alternates hands on
every letter.

`KEYMAP.md` is the human-readable keymap. Each folder has its own README.
