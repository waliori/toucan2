# Toucan2 — custom layout, firmware and trainer

One repo for everything around my beekeeb Toucan2 (Prospector dongle, two halves on beekeeb's firmware).

Pipeline, in the order it was built:

1. `layout-optimizer/` — chats → corpus → analyzer → simulated annealing → the custom letter layout (`custom_free_v2.json`).
2. `studio-rpc/` — ZMK Studio RPC scripts: apply / verify / reset the keymap on the dongle over USB without reflashing.
3. `firmware/` — ZMK v0.3 dongle firmware built with zmk-nix: the keymap (source of truth), accent layers, Prospector screen, live key feed.
4. `trainer/` — browser typing trainer generated from the firmware keymap, with per-key mastery, mirrored board and live feed over WebSerial.

`KEYMAP.md` is the human-readable keymap. Each folder has its own README.
