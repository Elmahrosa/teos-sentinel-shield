import express from "express";

/**
 * Tries to load the real engine from dist/ without guessing a single export name.
 * Supported export shapes:
 * - default export function
 * - named: review | analyze | query | handleQuery
 */
async function loadEngine() {
  const candidates = [
    "../dist/review.js",
    "../dist/review/index.js",
    "../dist/index.js",
    "../dist/server.js",
    "../dist/api.js",
  ];

  for (const p of candidates) {
    try {
      const mod = await import(p);
      const fn =
        mod?.default ||
        mod?.review ||
        mod?.analyze ||
        mod?.query ||
        mod?.handleQuery;

      if (typeof fn === "function") {
        return { path: p.replace("../", ""), fn };
      }
    } catch {
      // ignore and try next
    }
  }

  return null;
}

const app = express();
app.use(express.json({ limit: "2mb" }));

// ─────────────────────────────────────────────
// Health
// ─────────────────────────────────────────────
app.get("/health", (_req, res) => res.status(200).json({ ok: true }));

// ─────────────────────────────────────────────
// Status
// ─────────────────────────────────────────────
app.get("/api/v1/status", async (_req, res) => {
  const engine = await loadEngine();
  res.status(200).json({
    ok: true,
    service: "agent-code-risk-mcp",
    engine: engine ? { loaded: true, from: engine.path } : { loaded: false },
  });
});

// ─────────────────────────────────────────────
// Landing UI
// ─────────────────────────────────────────────
app.get("/", async (_req, res) => {
  const engine = await loadEngine();
  res.status(200).type("html").send(`<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Agent Code Risk MCP</title>
  <style>
    body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;max-width:980px;margin:40px auto;padding:0 16px;line-height:1.5}
    code,pre{background:#f5f5f5;padding:2px 6px;border-radius:6px}
    pre{padding:12px;overflow:auto}
    .card{border:1px solid #ddd;border-radius:12px;padding:16px;margin:14px 0}
    .muted{opacity:.75}
    a{color:#0b57d0;text-decoration:none}
    a:hover{text-decoration:underline}
  </style>
</head>
<body>
  <h1>Agent Code Risk MCP</h1>
  <p>Status: <b>Online ✅</b></p>

  <div class="card">
    <h2>API</h2>
    <ul>
      <li><a href="/health">GET /health</a></li>
      <li><a href="/api/v1/status">GET /api/v1/status</a></li>
      <li><code>POST /api/v1/query</code> (JSON)</li>
    </ul>
    <p class="muted">Engine: ${engine ? `loaded from <code>${engine.path}</code>` : `not auto-detected yet (will return 501 until wired)`}</p>
  </div>

  <div class="card">
    <h2>Example</h2>
    <pre>curl -s http://localhost:8000/api/v1/status</pre>
    <pre>curl -s -X POST http://localhost:8000/api/v1/query \\
  -H "Content-Type: application/json" \\
  -d '{"input":"..."}'</pre>
  </div>

  <p class="muted">Elmahrosa / TEOS Labs</p>
</body>
</html>`);
});

// ─────────────────────────────────────────────
// Query endpoint (real when engine is detected)
// ─────────────────────────────────────────────
app.post("/api/v1/query", async (req, res) => {
  const engine = await loadEngine();

  if (!engine) {
    return res.status(501).json({
      ok: false,
      error: "EngineNotWired",
      message:
        "Express wrapper is live, but the real engine export was not auto-detected in dist/. " +
        "Build dist and ensure it exports a function (default or one of: review/analyze/query/handleQuery).",
      hint: "Run build, then verify dist outputs: ls dist && find dist -maxdepth 2 -type f -name '*.js' -print",
    });
  }

  try {
    const result = await engine.fn(req.body);
    return res.status(200).json({ ok: true, engine: engine.path, result });
  } catch (e) {
    return res.status(500).json({
      ok: false,
      error: "EngineError",
      message: e?.message || String(e),
    });
  }
});

// ─────────────────────────────────────────────
// Start
// ─────────────────────────────────────────────
const port = Number(process.env.PORT || 8000);
app.listen(port, "0.0.0.0", () => console.log("HTTP on", port));
