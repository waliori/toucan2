# Toucan2 firmware (halves)

ZMK v0.3 firmware for the two Toucan2 halves, built locally with [zmk-nix](https://github.com/lilyinstarlight/zmk-nix).
The **left half is the central**: it talks to the right half and to the computer (USB, or one of five Bluetooth
profiles). No dongle is needed; the Prospector runs the separate listener firmware in `../scanner/`.

- `config/toucan.keymap` — the keymap (source of truth; `KEYMAP.md` and `trainer/` derive from it)
- `config/toucan_left.conf`, `config/toucan_right.conf` — per-half options (sleep, battery, macro timing, status
  advertisement for the Prospector). The matrix, trackpad and nice!view come from beekeeb's module (`config/west.yml`).
- `boards/shields/key_feed/` + `src/key_feed.c` — live key feed: every key position and layer change goes out as a line
  on a second USB serial port of the left half (`feed: K <pos> <1|0>`, `feed: L <layer> <1|0>`); `trainer/` reads it
  over WebSerial. Cabled, the left half therefore shows two serial ports: the feed is the first (USB interface 0,
  e.g. `/dev/ttyACM0`), Studio the second (interface 3). `node studio-rpc/reset.mjs` without a path probes both.

## Build

```sh
cd firmware
nix build            # result/zmk_left.uf2, result/zmk_right.uf2, result/zmk_reset.uf2 (settings reset)
```

First build downloads Zephyr + the ARM toolchain (slow once, cached after). `out/` keeps a dated copy of each flashed
build (`result/` is a Nix store symlink and disappears on garbage collection).

## Flash a half

1. Double-tap the reset button next to the USB-C port (or, on the left half, ADJ + BOOT). A `XIAO-SENSE` USB drive
   appears; mount it with `udisksctl mount -b /dev/sdX` if the desktop does not.
2. Copy the `.uf2` onto it. The half reboots by itself.

First time from a different topology (beekeeb's dongle firmware, or the tagged `dongle-central` build), flash
`zmk_reset.uf2` on **both** halves first so they forget their old bonds, then `zmk_left.uf2` / `zmk_right.uf2`.
The halves bond to each other on the first boot. Back up the running image before overwriting it: the bootloader drive's
`CURRENT.UF2` is a dump of it (copies live in `../bak/`, gitignored).

The ports are root-only until `sudo chmod a+rw /dev/ttyACM*` (or a udev rule for USB id 1d50:615e).

## Connect to a computer

- USB cable on the left half: types over USB, charges the half, carries the feed and Studio.
- Bluetooth: hold both middle thumbs (ADJ layer) and press BT0 to BT4 to choose a profile, then pair from the computer
  ("Toucan"). USB/BLE on the same layer picks the output when both are connected; BTclr forgets the current profile.

## OS side

Both machines must use the **US International** keyboard layout (dead keys):

- NixOS: `services.xserver.xkb = { layout = "us"; variant = "intl"; };` then `sudo nixos-rebuild switch`
  (compositors that read `XKB_DEFAULT_VARIANT` or their own `kb_variant` setting need `intl` there too).
- Windows: Settings → Time & language → Language → English → Options → Add keyboard → *United States-International*.
  Keep plain *US* installed too and switch with Win+Space when typing French on the laptop's own keyboard.

## History

Until 2026-10-20 the Prospector was the split central (dongle mode) and the halves ran beekeeb's peripheral firmware.
That build is kept under the git tag `dongle-central` (`boards/shields/toucan_dongle`, `config/toucan_dongle.*`).
