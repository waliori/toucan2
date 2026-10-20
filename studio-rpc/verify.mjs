import { connect, keymap, behaviors } from "./zmk.mjs";
const { conn, close } = await connect(process.argv[2]);
try {
  const km = await keymap(conn); const beh = await behaviors(conn);
  const name = Object.fromEntries(Object.entries(beh).map(([n, v]) => [v.id, n]));
  const show = (l, p) => { const b = km.layers.find((x) => x.id === l).bindings[p]; return `${name[b.behaviorId]}(${b.param1},${b.param2})`; };
  console.log("base 36 (Ctrl thumb):", show(0, 36), "| base 30 ('):", show(0, 30), "| base 20 (e):", show(0, 20));
  console.log("AC1 20:", show(5, 20), "| AC1 19:", show(5, 19), "| AC1 13:", show(5, 13), "| AC1 36:", show(5, 36));
  console.log("AC2 20:", show(6, 20), "| SYM 13:", show(2, 13), "| ADJ 0:", show(3, 0));
  console.log("behaviors:", Object.keys(beh).join(", "));
} finally { await close().catch(() => {}); }
