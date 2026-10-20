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
dongle firmware, flash `zmk_reset.uf2` first. This unit's ambient light sensor is dead, so brightness is fixed
(`prospector_scanner.conf`); the original Prospector has no touch, so the layout is chosen at build time (Operator).
