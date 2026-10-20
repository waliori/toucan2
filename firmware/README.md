# Toucan2 firmware (dongle)

ZMK v0.3 firmware for the Prospector dongle driving the two Toucan2 halves. Built locally with
[zmk-nix](https://github.com/lilyinstarlight/zmk-nix), no GitHub needed.

- `config/toucan_dongle.keymap` — the keymap (source of truth; `KEYMAP.md` and `trainer/` derive from it)
- `config/toucan_dongle.conf` — dongle options (no sleep, battery proxy for the screen, macro timing)
- `config/west.yml` — pinned ZMK + beekeeb Toucan2 module + Prospector screen module
- `boards/shields/toucan_dongle/` — the dongle shield (central, no matrix; beekeeb's public repo has none)

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

The halves are never reflashed for keymap changes; they stay on beekeeb's firmware.

## OS side

Both machines must use the **US International** keyboard layout (dead keys):

- NixOS: `services.xserver.xkb = { layout = "us"; variant = "intl"; };` then `sudo nixos-rebuild switch`
  (compositors that read `XKB_DEFAULT_VARIANT` or their own `kb_variant` setting need `intl` there too).
- Windows: Settings → Time & language → Language → English → Options → Add keyboard → *United States-International*.
  Keep plain *US* installed too and switch with Win+Space when typing French on the laptop's own keyboard.

## Latest build

`out/` keeps a dated copy of each flashed build (`result/` is a Nix store symlink and disappears on garbage collection).
