const axios = require('axios');
const { checkService, ACTIVATION_API, getCredits, consumeCredit } = require("../services/activation.service.js");
const { MCP_API, MCP_CONFIGURED, scanWithMcp, getEngineInfo } = require("../services/mcp.service.js");
const { resolveEngineInfo } = require("../services/engine-metadata.js");
const { scanGitHubRepo } = require("../services/github.service.js");
const { redis } = require("../services/redis.service.js");
const { getVersion } = require("../../version.cjs");

/**
 * @openapi
 * /live:
 *   get:
 *     summary: Liveness probe
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is alive
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 alive:
 *                   type: boolean
 *                   example: true
 */
/**
 * @openapi
 * /ready:
 *   get:
 *     summary: Readiness probe
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is ready
 */
/**
 * @openapi
 * /health:
 *   get:
 *     summary: Detailed health check
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service health details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 service:
 *                   type: string
 *                   example: teoslinker-bot
 *                 redis:
 *                   type: string
 *                   example: connected
 *                 activation:
 *                   type: string
 *                   example: online
 *                 mcp:
 *                   type: string
 *                   example: online
 */

function registerHealthRoutes(app, releasePollingSession, serverDegraded) {
  app.get("/live", async (req, res) => {
    res.json({ status: "ok", alive: true });
  });

  app.get("/ready", async (req, res) => {
    res.json({ status: "ok", ready: true });
  });

  app.post("/release", async (req, res) => {
    const dockerRelease = req.headers["x-docker-release"];
    if (!dockerRelease) {
      return res.status(400).json({ status: "error", message: "X-Docker-Release header required" });
    }
    releasePollingSession(5);
    res.json({ status: "ok", released: true, duration_minutes: 5 });
  });

  app.get("/providers", (req, res) => {
    const { modelService, MODELS } = require("../services/model.service");
    const providers = {};
    for (const [id, cfg] of Object.entries(MODELS)) {
      const provider = cfg.provider;
      if (!providers[provider]) {
        providers[provider] = {
          healthy: modelService.isProviderHealthy(provider),
          models: []
        };
      }
      providers[provider].models.push({
        id,
        label: cfg.label,
        available: modelService.isModelAvailable(id),
        cost: cfg.cost
      });
    }
    res.json({
      timestamp: new Date().toISOString(),
      providers
    });
  });

  app.get("/health", async (req, res) => {
    const activationOk = !serverDegraded ? await checkService(`${ACTIVATION_API}/health`) : false;
    const mcpOk = MCP_CONFIGURED ? await checkService(`${MCP_API}/health`) : false;
    const { modelService } = require("../services/model.service");
    const groqHealthy = modelService.isProviderHealthy('groq');
    const anthropicHealthy = modelService.isProviderHealthy('anthropic');
    // Engine metadata: live Sentinel /engines when available, otherwise canonical
    // in-process values (never null / never a stray placeholder such as "4.0").
    const engineInfo = await getEngineInfo().catch(() => null);
    const engineMeta = resolveEngineInfo(engineInfo);
    res.json({
      status: serverDegraded ? "degraded" : "ok",
      service: "teoslinker-bot",
      engine: engineMeta.engineVersion,
      rules: engineMeta.totalRules,
      rulePack: engineMeta.rulePackVersion,
      engineSource: engineMeta.source,
      redis: redis ? "connected" : "disabled",
      activation: serverDegraded ? "unconfigured" : (activationOk ? "online" : "down"),
      mcp: !MCP_CONFIGURED ? "not-configured" : (mcpOk ? "online" : "down"),
      providers: {
        groq: groqHealthy ? "online" : "down",
        anthropic: anthropicHealthy ? "online" : "down"
      },
      version: getVersion()
    });
  });

  // ── Debug endpoints: only available outside production ──
  if (process.env.NODE_ENV !== 'production') {
    app.get("/debug/auth/:userId", async (req, res) => {
      const userId = req.params.userId;
      const results = { userId, timestamp: new Date().toISOString() };
      
      try {
        const credits = await getCredits(userId);
        results.getCredits = { success: true, credits };
      } catch (err) {
        results.getCredits = { success: false, error: err.message };
      }

      try {
        const left = await consumeCredit(userId, 0);
        results.consumeCredit = { success: true, credits: left };
      } catch (err) {
        results.consumeCredit = { success: false, error: err.message };
      }

      res.json(results);
    });

    app.get("/debug/scan-github", async (req, res) => {
      const url = req.query.url;
      if (!url) return res.status(400).json({ error: "Missing ?url= parameter" });
      try {
        const result = await Promise.race([
          scanGitHubRepo(url, scanWithMcp),
          new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 60000))
        ]);
        res.json({ success: true, result: { ...result, findings: (result.findings || []).length } });
      } catch (err) {
        res.json({ success: false, error: err.message });
      }
    });

    app.get("/debug/scan-full", async (req, res) => {
      const url = req.query.url || 'https://github.com/Elmahrosa/UnityCare-Platform';
      try {
        const result = await Promise.race([
          scanGitHubRepo(url, scanWithMcp),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 60000))
        ]);
        res.json({ success: true, result: { ...result, findings: (result.findings || []).length, skippedBinaries: (result.skippedBinaries || []).length } });
      } catch (err) {
        res.json({ success: false, error: err.message });
      }
    });

    app.get("/debug/ping", async (req, res) => {
      const timings = { steps: [], start: Date.now() };
      try {
        const s = Date.now();
        const mcp = await checkService(`${MCP_API}/health`);
        timings.steps.push({ name: "mcp_health", ms: Date.now() - s });
        const s2 = Date.now();
        const ghApi = await axios.get('https://api.github.com/repos/Elmahrosa/UnityCare-Platform', { timeout: 5000, validateStatus: () => true });
        timings.steps.push({ name: "github_api", ms: Date.now() - s2, status: ghApi.status });
        const s3 = Date.now();
        const ghRaw = await axios.get('https://raw.githubusercontent.com/Elmahrosa/UnityCare-Platform/main/package.json', { timeout: 5000, responseType: 'text', validateStatus: () => true });
        timings.steps.push({ name: "github_raw", ms: Date.now() - s3, len: (ghRaw.data || '').length });
        timings.elapsed = Date.now() - timings.start;
        res.json({ success: true, mcpStatus: mcp, timings });
      } catch (err) {
        timings.elapsed = Date.now() - timings.start;
        res.json({ success: false, error: err.message, timings });
      }
    });
  }
}

module.exports = { registerHealthRoutes };
