# Toucan2 — the Walid layout (WLD), firmware and trainer

One repo for everything around my beekeeb Toucan2 (two wireless halves, left half is the central; the Prospector is a status screen).

Pipeline, in the order it was built:

1. `layout-optimizer/` — chats → corpus → analyzer → simulated annealing → the Walid layout (`custom_free_v2.json`).
2. `studio-rpc/` — ZMK Studio RPC scripts: apply / verify / reset the keymap on the keyboard over USB without reflashing.
3. `firmware/` — ZMK v0.3 firmware for the two halves built with zmk-nix: the keymap (source of truth), accent layers, live key feed, status broadcast for the Prospector. `scanner/` — the Prospector's own firmware (ZMK main), a listener that shows layer, batteries, modifiers and profile. The old dongle-central firmware is under the git tag `dongle-central`.
4. `trainer/` — browser typing trainer generated from the firmware keymap, with per-key mastery, mirrored board and live feed over WebSerial. Hosted at https://toucan-trainer.waliori.workers.dev with cross-device sync (secret code, Cloudflare KV).

## The name

The layout is called **Walid**, short mark **WLD** (the layer name on the Prospector, the nice!view and in the trainer). Tagline:
*Walid's Annealed Layout with International Dead-keys*: letter positions found by simulated annealing, French accents typed
through US-International dead keys. The letters w, l, d sit in order on the top row, and typing "walid" alternates hands on
every letter.

`KEYMAP.md` is the human-readable keymap. Each folder has its own README.
