// Assembles dist/ for the Worker: the site at the root, the trainer under /trainer/.
//   node dist.mjs
import fs from "node:fs";
import { execFileSync } from "node:child_process";
const here = new URL(".", import.meta.url).pathname;
execFileSync("node", [here + "site/build.mjs"], { stdio: "inherit" });   // index.html from the template and the firmware keymap
fs.rmSync(here + "dist", { recursive: true, force: true });
const copy = (from, to, keep) => fs.cpSync(here + from, here + to, { recursive: true, filter: (p) => keep(p.slice(here.length + from.length).replace(/^\//, "")) });
copy("site", "dist", (p) => !/^(\.hallmark|build\.mjs|index\.tmpl\.html|data-anneal-seed5\.json|README\.md)/.test(p));
copy("trainer", "dist/trainer", (p) => !/^(worker\.mjs|gen\.mjs|selftest|README\.md|corpus|\.wrangler|node_modules)/.test(p));
console.log("dist/ written:", fs.readdirSync(here + "dist").join(" "), "| trainer:", fs.readdirSync(here + "dist/trainer").join(" "));
