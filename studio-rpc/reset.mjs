// After flashing new firmware: wait for unlock, drop the Studio-saved keymap, show what the device now runs.
import { connect, lockState, keymap, resetSettings, deviceInfo } from "./zmk.mjs";
const { conn, close } = await connect(process.argv[2] || "/dev/ttyACM0");
try {
  console.log("device:", await deviceInfo(conn));
  let ls = await lockState(conn); const t0 = Date.now();
  while (ls !== 1 && Date.now() - t0 < 120000) { console.log("LOCKED: hold NAV (left middle thumb) and press the bottom-left letter key..."); await new Promise((r) => setTimeout(r, 3000)); ls = await lockState(conn); }
  if (ls !== 1) { console.error("still locked"); process.exit(3); }
  console.log("resetSettings:", await resetSettings(conn));
  const km = await keymap(conn);
  console.log("layers now:", km.layers.map((l) => `${l.id}:${l.name}`).join(" "));
} finally { await close().catch(() => {}); }
