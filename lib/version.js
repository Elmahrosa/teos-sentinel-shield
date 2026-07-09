const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const pkg = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "..", "package.json"), "utf-8")
);

const GIT_COMMIT =
  process.env.GIT_COMMIT ||
  process.env.RAILWAY_GIT_COMMIT ||
  (() => {
    try {
      return execSync("git rev-parse HEAD", { encoding: "utf-8", timeout: 3000 }).trim();
    } catch { return "unknown"; }
  })();

const BUILD_DATE =
  process.env.BUILD_DATE ||
  new Date().toISOString().split("T")[0];

function getVersion() {
  return {
    service: "teos-sentinel-shield",
    version: pkg.version,
    commit: GIT_COMMIT,
    buildTime: BUILD_DATE,
    environment: process.env.NODE_ENV || "development",
  };
}

function printStartupBanner(logFn) {
  const v = getVersion();
  const sep = "\u2501".repeat(50);
  console.log(sep);
  console.log("  TEOS Sentinel Shield");
  console.log("  Version: " + v.version);
  console.log("  Commit:  " + v.commit);
  console.log("  Built:   " + v.buildTime);
  console.log("  Env:     " + v.environment);
  console.log(sep);
  if (logFn) {
    logFn("info", "Service started", { version: v.version, commit: v.commit });
  }
}

function versionHandler(req, res) {
  res.json(getVersion());
}

module.exports = { getVersion, printStartupBanner, versionHandler };
