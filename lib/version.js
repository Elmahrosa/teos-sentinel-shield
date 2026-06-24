const fs = require("fs");
const path = require("path");

let _meta = null;

function loadVersion() {
  if (_meta) return _meta;
  try {
    const p = path.resolve(__dirname, "..", ".version.json");
    _meta = JSON.parse(fs.readFileSync(p, "utf-8"));
  } catch {
    _meta = {
      service: "teos-sentinel-shield",
      commit: "unknown",
      buildTime: "unknown",
      environment: process.env.NODE_ENV || "development",
    };
  }
  return _meta;
}

function getVersion() {
  const m = loadVersion();
  return {
    service: m.service || "teos-sentinel-shield",
    version: "4.0.0",
    commit: m.commit || "unknown",
    buildTime: m.buildTime || "unknown",
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
