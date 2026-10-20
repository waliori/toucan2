# Toucan2 keymap via ZMK Studio RPC (no firmware flash)

Writes the keymap to the central (dongle) over its USB serial port using the same protocol as zmk.studio.

Setup once: `npm install --ignore-scripts`, then patch the client for Node ESM:
- add `.js` to relative imports in `node_modules/@zmkfirmware/zmk-studio-ts-client/lib/*.js`
- `import * as _m0 from "protobufjs/minimal"` → `import _m0 from "protobufjs/minimal.js"`

Use: close any zmk.studio tab (only one program can hold the port), unlock the keyboard
(hold middle-left thumb + bottom-left letter key), then `node apply.mjs --dry` / `node apply.mjs`.
`keymap_v1.mjs` is the Studio-only keymap that was applied before the firmware phase (history); since the
firmware flash the source of truth is `firmware/config/toucan_dongle.keymap`. `probe.mjs` dumps device state.
`node verify.mjs [port]` prints a few bindings read back from the device. `node reset.mjs` = Studio's "Restore stock settings": run it once after every firmware flash so the compiled
keymap replaces the Studio-saved one (keeps Bluetooth bonds).
