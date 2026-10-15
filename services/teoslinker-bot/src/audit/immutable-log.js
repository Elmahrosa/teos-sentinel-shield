const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const AUDIT_FILE = process.env.AUDIT_LOG_PATH || path.join(__dirname, '..', '..', 'audit.chain.log');
const CRITICAL_EVENTS = new Set(["BLOCK_VERDICT", "VERDICT_OVERRIDE", "ESCALATION", "REPLAY_ATTACK", "AUTH_FAILURE", "POLICY_VIOLATION", "FEEDBACK"]);

let previousHash = null;
let redis = null;

try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    const { Redis } = require("@upstash/redis");
    redis = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN });
  }
} catch (err) {
  console.error("ImmutableLog: failed to init Redis audit backend", err?.message);
}

function loadPreviousHash() {
  if (previousHash !== null) return previousHash;
  try {
    if (fs.existsSync(AUDIT_FILE)) {
      const data = fs.readFileSync(AUDIT_FILE, 'utf-8').trim();
      if (data) {
        const lines = data.split('\n').filter(Boolean);
        const last = JSON.parse(lines[lines.length - 1]);
        previousHash = last._hash || null;
      }
    }
  } catch (err) {
    console.error("ImmutableLog: loadPreviousHash failed", err?.message);
  }
  return previousHash;
}

function hashEntry(entry, prevHash) {
  const data = JSON.stringify(entry);
  const chainMaterial = prevHash ? data + prevHash : data;
  return crypto.createHash('sha3-256').update(chainMaterial).digest('hex');
}

function isCriticalEvent(event) {
  if (!event) return false;
  if (CRITICAL_EVENTS.has(event.eventType)) return true;
  return event.verdict === "BLOCK";
}

async function append(event) {
  if (!isCriticalEvent(event)) return;

  const prevHash = loadPreviousHash();
  const entry = {
    _audit: true,
    _version: 1,
    _prev_hash: prevHash || null,
    ts: Date.now(),
    timestamp: new Date().toISOString(),
    ...event,
  };

  entry._hash = hashEntry(entry, prevHash);
  previousHash = entry._hash;

  const line = JSON.stringify(entry) + "\n";

  try {
    fs.appendFileSync(AUDIT_FILE, line, 'utf-8');
  } catch (err) {
    console.error("ImmutableLog: file append failed", err?.message);
  }

  if (redis) {
    try {
      await redis.xadd("teos:audit", "*", "event", JSON.stringify(entry));
    } catch (err) {
      console.error("ImmutableLog: Redis xadd failed", err?.message);
    }
  }
}

function verifyChain() {
  const errors = [];
  let expectedHash = null;
  try {
    if (!fs.existsSync(AUDIT_FILE)) return { valid: true, count: 0, errors: [] };
    const data = fs.readFileSync(AUDIT_FILE, 'utf-8').trim();
    if (!data) return { valid: true, count: 0, errors: [] };
    const lines = data.split('\n').filter(Boolean);
    for (let i = 0; i < lines.length; i++) {
      const entry = JSON.parse(lines[i]);
      const storedHash = entry._hash;
      const storedPrev = entry._prev_hash;
      if (storedPrev !== expectedHash) {
        errors.push({ line: i + 1, reason: `prev_hash mismatch: expected ${expectedHash}, got ${storedPrev}` });
      }
      const computedHash = hashEntry(
        Object.fromEntries(Object.entries(entry).filter(([k]) => k !== '_hash')),
        expectedHash
      );
      if (computedHash !== storedHash) {
        errors.push({ line: i + 1, reason: `hash mismatch: computed ${computedHash}, stored ${storedHash}` });
      }
      expectedHash = storedHash;
    }
  } catch (err) {
    console.error("ImmutableLog: verifyChain error", err?.message);
    errors.push({ reason: `verification error: ${err.message}` });
  }
  return { valid: errors.length === 0, count: errors.length > 0 ? 0 : 0, errors };
}

async function recent(count = 50) {
  const events = [];
  try {
    if (redis) {
      const raw = await redis.xrevrange("teos:audit", "+", "-", "COUNT", count);
      for (const [, fields] of raw || []) {
        try { events.push(JSON.parse(fields[1])); } catch (err) {
          console.error("ImmutableLog: failed to parse Redis audit event", err?.message);
        }
      }
    }
  } catch (err) {
    console.error("ImmutableLog: Redis xrevrange failed", err?.message);
  }
  if (events.length === 0) {
    try {
      const data = fs.readFileSync(AUDIT_FILE, 'utf-8');
      const lines = data.trim().split('\n').filter(Boolean);
      for (const line of lines.slice(-count)) {
        try { events.push(JSON.parse(line)); } catch (err) {
          console.error("ImmutableLog: failed to parse file audit event", err?.message);
        }
      }
    } catch (err) {
      console.error("ImmutableLog: failed to read audit file", err?.message);
    }
  }
  return events;
}

module.exports = { append, verifyChain, recent, AUDIT_FILE };
