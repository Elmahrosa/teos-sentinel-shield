import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { logger } from "./logger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let _meta = null;

function loadVersion() {
  if (_meta) return _meta;
  try {
    const p = path.resolve(__dirname, "..", ".version.json");
    _meta = JSON.parse(fs.readFileSync(p, "utf-8"));
  } catch {
    _meta = {
      service: "teos-activation-service",
      commit: "unknown",
      buildTime: "unknown",
      environment: process.env.NODE_ENV || "development",
    };
  }
  return _meta;
}

export function getVersion() {
  const m = loadVersion();
  return {
    service: m.service || "teos-activation-service",
    version: "3.1.0",
    commit: m.commit || "unknown",
    buildTime: m.buildTime || "unknown",
    environment: process.env.NODE_ENV || "development",
  };
}

export function printStartupBanner() {
  const v = getVersion();
  const sep = "\u2501".repeat(50);
  console.log(sep);
  console.log(`  TEOS Activation Service`);
  console.log(`  Version: ${v.version}`);
  console.log(`  Commit:  ${v.commit}`);
  console.log(`  Built:   ${v.buildTime}`);
  console.log(`  Env:     ${v.environment}`);
  console.log(sep);
  logger.info({ version: v.version, commit: v.commit, buildTime: v.buildTime }, "Service started");
}

export function versionRouter() {
  return (req, res) => {
    res.json(getVersion());
  };
}
