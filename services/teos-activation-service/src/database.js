import Database from "better-sqlite3";
import pkg from "pg";
const { Pool } = pkg;
import fs from "fs";
import path from "path";
import { logger } from "./logger.js";

const DATABASE_URL = process.env.DATABASE_URL || "";

let db;
let pool;

function isPostgres() {
  return !!DATABASE_URL;
}

function connect() {
  if (DATABASE_URL) {
    pool = new Pool({ connectionString: DATABASE_URL, max: 10 });
    logger.info("Connected to PostgreSQL");
    return pool;
  }

  let dbPath = "./data/activation.db";
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    try {
      fs.mkdirSync(dbDir, { recursive: true });
    } catch (err) {
      logger.warn({ err }, "Cannot create /app/data, falling back to /tmp");
      dbPath = "/tmp/activation.db";
    }
  }
  try {
    fs.accessSync(dbDir, fs.constants.W_OK);
  } catch {
    logger.warn("Data directory not writable, falling back to /tmp");
    dbPath = "/tmp/activation.db";
  }
  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  logger.info({ dbPath }, "Connected to SQLite");
  return db;
}

async function run(sql, params = []) {
  if (isPostgres()) {
    const res = await pool.query(sql, params);
    return { changes: res.rowCount, lastInsertRowid: res.rows[0]?.id || null };
  }
  const stmt = db.prepare(sql);
  const info = stmt.run(...params);
  return { changes: info.changes, lastInsertRowid: info.lastInsertRowid };
}

async function get(sql, params = []) {
  if (isPostgres()) {
    const res = await pool.query(sql, params);
    return res.rows[0] || null;
  }
  return db.prepare(sql).get(...params) || null;
}

async function all(sql, params = []) {
  if (isPostgres()) {
    const res = await pool.query(sql, params);
    return res.rows;
  }
  return db.prepare(sql).all(...params);
}

async function exec(sql) {
  if (isPostgres()) {
    await pool.query(sql);
    return;
  }
  db.exec(sql);
}

async function close() {
  if (isPostgres()) {
    await pool.end();
  } else {
    db.close();
  }
}

function fixParams(sql, params) {
  if (isPostgres() && Array.isArray(params)) {
    let idx = 0;
    return sql.replace(/\?/g, () => `$${++idx}`);
  }
  return sql;
}

async function runP(sql, params = []) {
  return run(fixParams(sql, params), params);
}

async function getP(sql, params = []) {
  return get(fixParams(sql, params), params);
}

async function allP(sql, params = []) {
  return all(fixParams(sql, params), params);
}

async function tableExists(tableName) {
  if (isPostgres()) {
    const res = await pool.query(
      `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = $1)`,
      [tableName]
    );
    return res.rows[0]?.exists || false;
  }
  const res = db.prepare(
    `SELECT name FROM sqlite_master WHERE type='table' AND name=?`
  ).get(tableName);
  return !!res;
}

async function columnNames(tableName) {
  if (isPostgres()) {
    const res = await pool.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = $1`,
      [tableName]
    );
    return res.rows.map(r => r.column_name);
  }
  return db.prepare(`PRAGMA table_info(${tableName})`).all().map(c => c.name);
}

export { connect, run, get, all, exec, close, runP, getP, allP, tableExists, columnNames, isPostgres, fixParams };
