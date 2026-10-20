# Toucan2 firmware (dongle)

ZMK v0.3 firmware for the Prospector dongle driving the two Toucan2 halves. Built locally with
[zmk-nix](https://github.com/lilyinstarlight/zmk-nix), no GitHub needed.

- `config/toucan_dongle.keymap` — the keymap (source of truth; `KEYMAP.md` and `trainer/` derive from it)
- `config/toucan_dongle.conf` — dongle options (no sleep, battery proxy for the screen, macro timing)
- `config/west.yml` — pinned ZMK + beekeeb Toucan2 module + Prospector screen module
- `boards/shields/toucan_dongle/` — the dongle shield (central, no matrix; beekeeb's public repo has none)
- `src/key_feed.c` — live key feed: every key position and layer change goes out as a line on the USB logging
  port (`feed: K <pos> <1|0>`, `feed: L <layer> <1|0>`); `trainer/` reads it over WebSerial. The dongle therefore
  shows two serial ports: the feed is the first (USB interface 0, e.g. `/dev/ttyACM0`), Studio the second
  (interface 3). `node studio-rpc/reset.mjs` without a path probes both and keeps the one that answers RPC.

## Build

```sh
cd firmware
nix build            # result/zmk_dongle.uf2  (+ result/zmk_reset.uf2 = settings reset, emergencies only)
```

First build downloads Zephyr + the ARM toolchain (slow once, cached after).

## Flash the dongle

1. Hold NAV + SYM (both middle thumbs) and press Tab: the dongle reboots into its bootloader
   (or double-tap the reset button on the XIAO). A `XIAO-SENSE` USB drive appears.
2. Copy `result/zmk_dongle.uf2` onto it. It reboots by itself.
3. The Studio-saved keymap in flash overrides a freshly compiled one, so run once:
   `cd ../studio-rpc && node reset.mjs` (unlock when asked: hold NAV, press the bottom-left letter key).
   The ports are root-only until `sudo chmod a+rw /dev/ttyACM*` (or a udev rule for USB id 1d50:615e).

The halves are never reflashed for keymap changes; they stay on beekeeb's firmware.

## OS side

Both machines must use the **US International** keyboard layout (dead keys):

- NixOS: `services.xserver.xkb = { layout = "us"; variant = "intl"; };` then `sudo nixos-rebuild switch`
  (compositors that read `XKB_DEFAULT_VARIANT` or their own `kb_variant` setting need `intl` there too).
- Windows: Settings → Time & language → Language → English → Options → Add keyboard → *United States-International*.
  Keep plain *US* installed too and switch with Win+Space when typing French on the laptop's own keyboard.

## Latest build

`out/` keeps a dated copy of each flashed build (`result/` is a Nix store symlink and disappears on garbage collection).
