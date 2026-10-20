(async () => {
  const $ = (s) => document.querySelector(s);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const out = {}; const errs = []; window.addEventListener("error", (e) => errs.push(e.message));
  const T = window.TOUCAN; const byChar = {}; T.layers[0].keys.forEach((k) => { if (k.kind === "key" && k.char) byChar[k.char] = k; });
  const kd = (init) => { document.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, ...init })); document.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true, ...init })); };
  const press = async (ch, dt) => { const k = byChar[ch]; kd({ key: ch, code: k?.code || "Space", shiftKey: !!k?.shift }); if (dt) await sleep(dt); };
  const text = () => [...$("#text").children].map((s) => s.textContent).join("");
  const runText = async (dt, errAt = -1) => { const t = text(); for (let i = 0; i < t.length; i++) { if (i === errAt) { await press(t[i] === "a" ? "e" : "a", dt); kd({ key: "Backspace", code: "Backspace" }); } await press(t[i], dt); } await sleep(60); return $("#hint").textContent; };
  out.r0 = await runText(40, 3);
  out.spanErrShown = [...$("#text").children].filter((s) => s.className === "err").length;   // corrected => 0 red spans
  out.acc0 = $("#acc").textContent;
  for (let r = 1; r <= 7; r++) { kd({ key: "Enter", code: "Enter" }); await sleep(40); out["r" + r] = $("#lesson-name").textContent.slice(7, 9) + "| " + (await runText(20)); if ($("#lesson-name").textContent.includes("Lesson 2")) break; }
  kd({ key: "Enter", code: "Enter" }); await sleep(40); out.after = $("#lesson-name").textContent;
  out.map = [...$("#lesson-map").children].map((b) => (b.className ? "D" : "-") + b.textContent.replace(/\d/, "")).join(" ");
  $("#mastery").click(); out.masteryFills = [...document.querySelectorAll(".key rect")].filter((r) => r.style.fill).length; $("#mastery").click();
  // hint fading on a mastered key: no highlight immediately, highlight after 1 s
  kd({ key: "Escape", code: "Escape" }); await sleep(30);
  out.nextNow = document.querySelectorAll(".key.next").length + " hint=" + JSON.stringify($("#hint").textContent); await sleep(1100); out.nextLater = document.querySelectorAll(".key.next").length + " hint=" + $("#hint").textContent;
  // label fading: known keys lose their label in auto mode, keep it in always mode, board hidden in off mode
  const labels = () => [...document.querySelectorAll(".key")].filter((g) => g.dataset.char && g.querySelector("text").textContent).length;
  const known = [...document.querySelectorAll(".key")].filter((g) => g.dataset.char).length;
  out.labelsAuto = labels() + "/" + known;
  $("#hints").click(); out.labelsAlways = labels() + " " + $("#hints").textContent;
  $("#hints").click(); out.boardOff = getComputedStyle(document.querySelector("footer")).display + " " + $("#hints").textContent;
  $("#hints").click(); out.backToAuto = $("#hints").textContent;
  // every lesson generates text without errors
  out.lessons = [];
  for (const b of [...$("#lesson-map").children]) { b.click(); await sleep(30); out.lessons.push($("#lesson-name").textContent.slice(16) + ": " + text().slice(0, 50)); }
  for (const m of ["words-en", "words-fr", "words-mix", "layers"]) { document.querySelector(`[data-mode="${m}"]`).click(); await sleep(30); out.lessons.push(m + ": " + text().split(" ").length + " words"); }
  out.errors = errs;
  return out;
})()
