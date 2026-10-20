// Progress sync: one JSON blob per secret code, GET /p/<code> reads it, PUT /p/<code> replaces it.
// Everything else is served from the static assets (index.html, keymap.js). Last writer wins; the page
// compares the toucan.updated stamp inside the blob.
export default {
  async fetch(req, env) {
    const m = /^\/p\/([a-f0-9]{32})$/.exec(new URL(req.url).pathname);
    if (!m) return new Response("not found", { status: 404 });
    if (req.method === "GET") {
      const v = await env.PROGRESS.get(m[1]);
      return new Response(v ?? "null", { headers: { "content-type": "application/json", "cache-control": "no-store" } });
    }
    if (req.method === "PUT") {
      const body = await req.text();
      if (body.length > 65536) return new Response("too big", { status: 413 });
      try { if (typeof JSON.parse(body) !== "object") throw 0; } catch { return new Response("bad json", { status: 400 }); }
      await env.PROGRESS.put(m[1], body);
      return new Response("ok");
    }
    return new Response("method", { status: 405 });
  },
};
