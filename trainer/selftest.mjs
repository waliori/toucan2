// Headless self-test: node selftest.mjs [url]  (needs google-chrome-stable and the trainer served at the url; runs selftest.scenario.js in the page)
import { spawn } from "node:child_process"; import { readFileSync } from "node:fs";
const url = process.argv[2] || "http://127.0.0.1:8765/index.html?selftest"; const file = new URL("./selftest.scenario.js", import.meta.url); process.env.FRESH = "1";
const port = 9333;
const chrome = spawn("google-chrome-stable", ["--headless=new", "--disable-gpu", "--no-first-run", `--remote-debugging-port=${port}`, `--user-data-dir=${process.env.TMPDIR || "/tmp"}/cdp-profile`, url], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let targets; for (let i = 0; i < 40; i++) { try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (targets.some((t) => t.url.startsWith(url.split("?")[0]))) break; } catch {} await sleep(250); }
const t = targets.find((t) => t.url.startsWith(url.split("?")[0]));
const ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise((r) => ws.onopen = r);
let id = 0; const pending = new Map();
ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } else if (d.method === "Runtime.consoleAPICalled") console.log("[console]", d.params.args.map((a) => a.value ?? a.description).join(" ")); else if (d.method === "Runtime.exceptionThrown") console.log("[exception]", d.params.exceptionDetails.exception?.description); };
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
await send("Runtime.enable"); await send("Page.enable"); await sleep(300);
if (process.env.FRESH) { await send("Runtime.evaluate", { expression: "localStorage.clear()" }); await send("Page.reload"); await sleep(800); }
const res = await send("Runtime.evaluate", { expression: readFileSync(file, "utf8"), awaitPromise: true, returnByValue: true });
console.log(res.result?.exceptionDetails ? JSON.stringify(res.result.exceptionDetails) : JSON.stringify(res.result?.result?.value, null, 1));
ws.close(); chrome.kill(); process.exit(0);
