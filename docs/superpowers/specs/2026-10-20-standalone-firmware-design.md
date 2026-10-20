# Standalone Toucan2 firmware + Prospector as status scanner (2026-10-20)

## Intent
Use the keyboard without the dongle: grab both halves and the laptop, go, type. The halves pair
straight to each computer over Bluetooth. The Prospector stops being the keyboard's brain and
becomes a status screen (layer, batteries, modifiers, profile, wpm) that only listens.

## Why this shape
ZMK fixes the central/peripheral role at build time; there is no runtime switch between
"dongle" and "no dongle". So the halves get the standard beekeeb topology (left = central, right =
peripheral) with our keymap, and the Prospector gets t-ogura's scanner firmware, which reads BLE
status advertisements the central broadcasts without using a connection slot.

## What changes
- **Halves** (firmware/, ZMK v0.3 line as today, built with zmk-nix):
  - shields `toucan_left rgbled_adapter nice_view_gem` (central, Studio, live key feed) and
    `toucan_right rgbled_adapter`, plus `settings_reset`; beekeeb's module supplies the matrix,
    trackpad and input-split, exactly as its own builds do.
  - keymap moves from `config/toucan_dongle.keymap` to `config/toucan.keymap` (ZMK picks the
    keymap by shield family name). Content unchanged: Walid layers, accent prefix, BT/USB keys.
  - `config/toucan_left.overlay`: second CDC ACM port for the key feed (`zephyr,console`), same as
    the dongle overlay today. `config/toucan_left.conf` / `toucan_right.conf`: battery reporting,
    sleep like beekeeb (deep sleep after 60 min), macro timing, feed + minimal logging, and
    `CONFIG_ZMK_STATUS_ADVERTISEMENT=y`, `CONFIG_ZMK_STATUS_ADV_KEYBOARD_NAME="Toucan"`,
    `CONFIG_ZMK_STATUS_ADV_CENTRAL_SIDE="LEFT"`.
  - west.yml: carrefinho's prospector module out, t-ogura's `prospector-zmk-module` v2.2.3 in
    (same Kconfig namespace, so they cannot coexist). The `toucan_dongle` shield and dongle build
    are removed from the tree and kept under the git tag `dongle-central`.
- **Prospector** (new `scanner/`, ZMK main + Zephyr 4, separate flake because the scanner does not
  build on v0.3): shield `prospector_scanner` on `xiao_ble/nrf52840/zmk`, t-ogura's reference
  conf, non-touch mode, ambient light sensor off (this unit's APDS9960 is dead), fixed brightness.
- **Repo**: firmware README rewritten for the new flash procedure; KEYMAP.md notes that BT0-BT4 and
  USB/BLE now select the keyboard's own host profile; studio-rpc and trainer docs say the feed and
  Studio ports are on the left half's USB; trainer code unchanged.

## Flash procedure (user does the physical steps; irreversible for the beekeeb firmware)
1. Back up each half: double-tap reset, mount XIAO-SENSE, copy `CURRENT.UF2` to `bak/`.
2. Flash `settings_reset` on left, then right (clears the bonds to the dongle).
3. Flash `toucan_left.uf2`, `toucan_right.uf2`. The halves bond to each other on first boot.
4. Pair the laptop: hold NAV+SYM (ADJ), press BT1, pick "Toucan" in the laptop's Bluetooth list.
   Desktop: USB cable on the left half (also charges it and carries the feed + Studio), or BT0.
5. Prospector: `settings_reset` then `prospector_scanner.uf2`. It shows "Toucan" within seconds.

## Non-goals
- Switching between dongle-central and standalone at runtime (ZMK cannot).
- Keeping the dongle-central build buildable alongside (tag only).
- Touch mode / new Prospector hardware features.

## Costs accepted
- Left half battery drains faster (it is the central and talks to the host).
- Live key feed and Studio need the left half cabled; wireless = no feed.
- ZMK main toolchain for the scanner is a second (cached) Nix build.

## Open questions for Walid
1. Does the left half have the small nice!view screen? (beekeeb's build assumes it.)
2. Desktop: Bluetooth available, or cable the left half at the desk? (cable recommended.)
3. OK to drop the dongle-central build from the tree (recoverable from the tag)?
