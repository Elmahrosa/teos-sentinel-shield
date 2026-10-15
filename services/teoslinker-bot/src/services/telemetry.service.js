const { Redis } = require("@upstash/redis");

let redis = null;
try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN });
  }
} catch (e) {
  console.warn("[telemetry] Redis init failed — running without telemetry:", e?.message);
}

const MAX_QUEUE = 200;
const BATCH_SIZE = 20;
const FLUSH_INTERVAL = 15000;
const SERIALIZATION_TIMEOUT_MS = 50;
const WATCHDOG_TIMEOUT_MS = 30000;
const SAMPLING_RATE_UNDER_LOAD = 0.25;

const TTL = {
  verdict: 90 * 86400,
  runtime: 30 * 86400,
  trust: 90 * 86400,
  security: 180 * 86400,
  governance: 90 * 86400,
};

const queue = [];
let flushTimer = null;
let watchdogTimer = null;
let lastFlushTs = Date.now();
let overflowCount = 0;
let systemUnderStress = false;
let onDropFn = null;

function onTelemetryDrop(fn) { onDropFn = fn; }

async function flush() {
  if (queue.length === 0) return;
  const batch = queue.splice(0, Math.min(queue.length, BATCH_SIZE));
  if (!redis) {
    if (!systemUnderStress) batch.forEach(e => console.log("[telemetry]", JSON.stringify(e)));
    lastFlushTs = Date.now();
    return;
  }
  try {
    const p = redis.pipeline();
    for (const e of batch) {
      const key = `teos:tel:${e.type}:${e.ts}`;
      p.setex(key, TTL[e.type] || 86400, JSON.stringify(e));
    }
    await p.exec();
    lastFlushTs = Date.now();
  } catch {
    queue.unshift(...batch);
    if (queue.length > MAX_QUEUE * 2) {
      const dropped = queue.splice(MAX_QUEUE);
      overflowCount += dropped.length;
      if (onDropFn) onDropFn();
    }
  }
}

function push(type, data) {
  if (systemUnderStress && Math.random() > SAMPLING_RATE_UNDER_LOAD) return;
  if (queue.length >= MAX_QUEUE) {
    overflowCount++;
    if (onDropFn) onDropFn();
    return;
  }

  const timer = setTimeout(() => {}, SERIALIZATION_TIMEOUT_MS);
  try {
    queue.push({ type, ts: Date.now(), timestamp: new Date().toISOString(), ...data });
  } finally {
    clearTimeout(timer);
  }

  if (queue.length >= BATCH_SIZE) flush();
}

function emit(type, data) {
  setImmediate(() => push(type, data));
}

function checkWatchdog() {
  const elapsed = Date.now() - lastFlushTs;
  if (elapsed > WATCHDOG_TIMEOUT_MS && queue.length > 0) {
    systemUnderStress = true;
    flush();
    setTimeout(() => { systemUnderStress = false; }, 60000);
  }
}

function start() {
  if (flushTimer) return;
  flushTimer = setInterval(flush, FLUSH_INTERVAL);
  watchdogTimer = setInterval(checkWatchdog, 10000);
  if (flushTimer.unref) flushTimer.unref();
  if (watchdogTimer.unref) watchdogTimer.unref();
}

async function stop() {
  if (flushTimer) { clearInterval(flushTimer); flushTimer = null; }
  if (watchdogTimer) { clearInterval(watchdogTimer); watchdogTimer = null; }
  systemUnderStress = false;
  await flush();
}

function getStatus() {
  return { queueSize: queue.length, overflowCount, systemUnderStress, lastFlushAgo: Date.now() - lastFlushTs };
}

module.exports = { emit, start, stop, flush, TTL, getStatus, onTelemetryDrop };
