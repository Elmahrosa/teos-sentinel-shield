const fs = require('fs');
const path = require('path');
const { setRuleHashes } = require('../governance/decision-fingerprint');

const REGISTRY_PATH = path.join(__dirname, 'registry.json');

let registry = {};
let loaded = false;

function load() {
  if (loaded) return registry;
  try {
    const raw = fs.readFileSync(REGISTRY_PATH, 'utf-8');
    registry = JSON.parse(raw);
    loaded = true;
    setRuleHashes(registry);
  } catch {
    registry = {};
  }
  return registry;
}

function getRule(id) {
  if (!loaded) load();
  return registry[id] || null;
}

function listActive() {
  if (!loaded) load();
  const now = new Date().toISOString();
  return Object.fromEntries(
    Object.entries(registry).filter(([, r]) => !r.deprecatedAt || r.deprecatedAt > now)
  );
}

function getVersion(id) {
  const rule = getRule(id);
  return rule ? rule.version : null;
}

module.exports = { load, getRule, listActive, getVersion, REGISTRY_PATH };
