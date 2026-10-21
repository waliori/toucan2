# Prospector as a status scanner

Firmware for the Prospector (XIAO nRF52840 + 240×280 LCD) that **listens** instead of being the keyboard's central:
the left half broadcasts its state in Bluetooth advertisements (`CONFIG_ZMK_STATUS_ADVERTISEMENT` in
`../firmware/config/toucan_left.conf`) and the screen shows layer name, both batteries, modifiers, active profile and
wpm. No connection slot is used, so the keyboard works exactly the same with the Prospector off or in another room.

Module: [t-ogura/prospector-zmk-module](https://github.com/t-ogura/prospector-zmk-module) v2.2.3, scanner shield.
It needs ZMK main / Zephyr 4, hence its own flake and `config/west.yml` (pinned to the same revisions zmk-nix builds
itself with).

```sh
cd scanner
nix build            # result/zmk_scanner.uf2 (flash this) and result/zmk_reset.uf2
```

Flash like a half: double-tap the reset button on the XIAO, copy the file onto the `XIAO-SENSE` drive. Coming from the
dongle firmware, flash `zmk_reset.uf2` first. In use since 2026-10-20 (the former dongle-central image is in `../bak/`). This unit's ambient light sensor is dead, so brightness is fixed
(`prospector_scanner.conf`); the original Prospector has no touch, so the layout is chosen at build time (Operator).

The screen is the module's **Operator** layout (`CONFIG_PROSPECTOR_DEFAULT_LAYOUT=2`): wpm gauge, modifiers, both
batteries, USB/BLE and the five ZMK profiles. Other built-in layouts: 0 YADS, 1 Field, 3 Radii; the original Prospector
has no touch, so the layout is a build-time choice. Changing what is shown beyond that means editing the module's LVGL
code (`boards/shields/prospector_scanner/src/*_layout.c`) in a fork.
