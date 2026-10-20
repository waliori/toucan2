// Apply keymap_v1 to the dongle via Studio RPC, verify, save.
import { connect, lockState, keymap, setBinding, save, discard } from "./zmk.mjs";
import { LAYERS } from "./keymap_v1.mjs";
import { SetLayerBindingResponse } from "@zmkfirmware/zmk-studio-ts-client/keymap";

const DRY = process.argv.includes("--dry");
const { conn, close } = await connect();
const timer = setTimeout(() => { console.error("timeout"); process.exit(2); }, 180000);
try {
  let ls = await lockState(conn);
  const t0 = Date.now();
  while (ls !== 1 && Date.now() - t0 < 90000) {           // 1 = UNLOCKED
    console.log("device is LOCKED: hold the middle left thumb key and press the bottom-left letter key (old Z) to unlock...");
    await new Promise((r) => setTimeout(r, 3000));
    ls = await lockState(conn);
  }
  if (ls !== 1) { console.error("still locked, aborting"); process.exit(3); }

  const before = await keymap(conn);
  const ids = before.layers.map((l) => l.id);
  console.log("layers on device:", before.layers.map((l) => `${l.id}:${l.name}`).join(" "));
  let changed = 0, errors = 0;
  for (const [idStr, bindings] of Object.entries(LAYERS)) {
    const id = Number(idStr);
    if (!ids.includes(id)) throw new Error("missing layer " + id);
    const cur = before.layers.find((l) => l.id === id).bindings;
    for (let pos = 0; pos < 42; pos++) {
      const [b, p1, p2] = bindings[pos];
      const c = cur[pos];
      if (c.behaviorId === b && c.param1 === p1 && c.param2 === p2) continue;
      changed++;
      if (DRY) continue;
      const r = await setBinding(conn, id, pos, b, p1, p2);
      if (r !== 0) { errors++; console.error(`layer ${id} pos ${pos} -> ${SetLayerBindingResponse[r]} (b=${b} p1=${p1} p2=${p2})`); }
    }
  }
  console.log(`bindings to change: ${changed}, errors: ${errors}${DRY ? " (dry run)" : ""}`);
  if (DRY) process.exit(0);
  if (errors) { console.error("discarding due to errors"); await discard(conn); process.exit(4); }

  // verify
  const after = await keymap(conn);
  let mismatches = 0;
  for (const [idStr, bindings] of Object.entries(LAYERS)) {
    const cur = after.layers.find((l) => l.id === Number(idStr)).bindings;
    for (let pos = 0; pos < 42; pos++) {
      const [b, p1, p2] = bindings[pos]; const c = cur[pos];
      if (!(c.behaviorId === b && c.param1 === p1 && c.param2 === p2)) { mismatches++; console.error(`verify mismatch layer ${idStr} pos ${pos}`); }
    }
  }
  if (mismatches) { console.error("verification failed, discarding"); await discard(conn); process.exit(5); }
  const s = await save(conn);
  console.log("save:", JSON.stringify(s));
  if (!s.ok) process.exit(6);
  console.log("DONE: keymap written and saved to flash");
} finally {
  clearTimeout(timer);
  await close().catch(() => {});
}
