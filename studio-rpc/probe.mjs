// Read-only probe: device info, lock state, behaviors, keymap, physical layout.
import { connect, deviceInfo, lockState, behaviors, keymap, physicalLayouts } from "./zmk.mjs";
import { LockState } from "@zmkfirmware/zmk-studio-ts-client/core";
import { SetLayerBindingResponse } from "@zmkfirmware/zmk-studio-ts-client/keymap";
import fs from "node:fs";

const { conn, close } = await connect();
const timer = setTimeout(() => { console.error("timeout"); process.exit(2); }, 20000);
try {
  console.log("device:", await deviceInfo(conn));
  const ls = await lockState(conn);
  console.log("lock state:", ls, LockState[ls]);
  const beh = await behaviors(conn);
  console.log("behaviors:");
  for (const [name, b] of Object.entries(beh)) {
    const params = b.metadata.map((m) => ({
      p1: (m.param1 || []).map((p) => p.name + (p.hidUsage ? "(hid)" : p.layerId ? "(layer)" : p.range ? `(${p.range.min}-${p.range.max})` : p.constant !== undefined ? `(=${p.constant})` : p.nil ? "(nil)" : "")),
      p2: (m.param2 || []).map((p) => p.name + (p.hidUsage ? "(hid)" : p.layerId ? "(layer)" : p.range ? `(${p.range.min}-${p.range.max})` : p.constant !== undefined ? `(=${p.constant})` : p.nil ? "(nil)" : "")),
    }));
    console.log(`  ${b.id}\t${name}\t${JSON.stringify(params)}`);
  }
  const km = await keymap(conn);
  console.log("keymap: availableLayers", km.availableLayers, "maxName", km.maxLayerNameLength);
  for (const l of km.layers) {
    console.log(`  layer id=${l.id} name=${l.name} keys=${l.bindings.length}`);
    console.log("   ", l.bindings.map((b) => `${b.behaviorId}:${b.param1}:${b.param2}`).join(" "));
  }
  const pl = await physicalLayouts(conn);
  console.log("physical layouts: active", pl.activeLayoutIndex, pl.layouts.map((l) => `${l.name}(${l.keys.length})`));
  fs.writeFileSync("state.json", JSON.stringify({ behaviors: beh, keymap: km, layouts: pl }, null, 1));
  console.log("SetLayerBindingResponse enum:", SetLayerBindingResponse);
} finally {
  clearTimeout(timer);
  await close();
}
