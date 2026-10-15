const fs = require("fs");
const path = require("path");

let _meta = null;

// Provenance for the running build, so the deployed commit is never a mystery.
// Railway injects RAILWAY_GIT_* when the service is deployed from a connected
// GitHub repo. A checked-in .version.json at the project root can override any
// field (useful for deploys that are not wired to GitHub).
function loadVersion() {
  if (_meta) return _meta;
  let file;
  try {
    file = JSON.parse(fs.readFileSync(path.resolve(__dirname, ".version.json"), "utf-8"));
  } catch {
    file = {};
  }
  _meta = {
    service: file.service || "teoslinker-bot",
    version: file.version || process.env.npm_package_version || require("./package.json").version,
    commit: file.commit || process.env.RAILWAY_GIT_COMMIT_SHA || process.env.GIT_COMMIT || "unknown",
    branch: file.branch || process.env.RAILWAY_GIT_BRANCH || "unknown",
    buildTime: file.buildTime || process.env.BUILD_TIME || "unknown",
    // Container start time — the closest signal we have to "when did this build
    // actually go live" (Railway does not expose a build timestamp).
    startedAt: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  };
  return _meta;
}

function getVersion() {
  const m = loadVersion();
  return {
    service: m.service,
    version: m.version,
    commit: m.commit,
    branch: m.branch,
    buildTime: m.buildTime,
    startedAt: m.startedAt,
    environment: m.environment,
  };
}

function printStartupBanner(logger) {
  const v = getVersion();
  const sep = "\u2501".repeat(50);
  console.log(sep);
  console.log("  TEOS Linker Bot");
  console.log("  Version: " + v.version);
  console.log("  Commit:  " + v.commit + (v.branch && v.branch !== "unknown" ? " (" + v.branch + ")" : ""));
  console.log("  Built:   " + v.buildTime);
  console.log("  Env:     " + v.environment);
  console.log(sep);
  if (logger) {
    logger.info(
      { version: v.version, commit: v.commit, branch: v.branch, buildTime: v.buildTime },
      "Service started"
    );
  }
}

function versionHandler(req, res) {
  res.json(getVersion());
}

module.exports = { getVersion, printStartupBanner, versionHandler };
