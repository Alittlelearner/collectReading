const { createServer } = require('node:http');
const { mkdirSync } = require('node:fs');
const { dirname, join, resolve } = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const { tmpdir } = require('node:os');

const HOST = process.env.COLLECTION_READ_DB_HOST || '127.0.0.1';
const PORT = Number(process.env.COLLECTION_READ_DB_PORT || 47631);
const DB_PATH = resolve(
  process.env.COLLECTION_READ_DB_PATH || join(getDefaultDataDir(), 'collection-read.global.db'),
);
const TRANSACTION_STALE_MS = 2 * 60 * 1000;

mkdirSync(dirname(DB_PATH), { recursive: true });

const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;');

let transactionOwner = null;
let transactionTouchedAt = 0;
let queue = Promise.resolve();

const server = createServer((req, res) => {
  handleRequest(req, res).catch((err) => {
    sendJson(res, 500, { ok: false, error: err instanceof Error ? err.message : String(err) });
  });
});

server.listen(PORT, HOST, () => {
  console.log(`[collection-read-db] listening on http://${HOST}:${PORT}`);
  console.log(`[collection-read-db] database file: ${DB_PATH}`);
});

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

async function handleRequest(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'GET' && req.url === '/health') {
    sendJson(res, 200, {
      ok: true,
      result: {
        dbPath: DB_PATH,
      },
    });
    return;
  }

  if (req.method === 'POST' && req.url === '/sql') {
    const body = await readJson(req);
    const result = await enqueue(() => executeSql(body));
    sendJson(res, 200, { ok: true, result });
    return;
  }

  if (req.method === 'POST' && req.url === '/client/close') {
    const body = await readJson(req).catch(() => ({}));
    if (body.clientId && body.clientId === transactionOwner) {
      db.exec('ROLLBACK');
      transactionOwner = null;
    }
    sendJson(res, 200, { ok: true, result: null });
    return;
  }

  sendJson(res, 404, { ok: false, error: 'Not found' });
}

async function enqueue(task) {
  const next = queue.then(task, task);
  queue = next.catch(() => undefined);
  return next;
}

async function executeSql(body) {
  const { clientId, command, source } = body || {};
  const params = Array.isArray(body?.params) ? body.params : [];

  if (!clientId || typeof clientId !== 'string') {
    throw new Error('clientId is required');
  }
  if (!['exec', 'run', 'all', 'first'].includes(command)) {
    throw new Error(`Unsupported SQL command: ${command}`);
  }
  if (typeof source !== 'string' || !source.trim()) {
    throw new Error('SQL source is required');
  }

  await waitForTransactionTurn(clientId);

  if (command === 'exec') {
    db.exec(source);
    trackTransaction(clientId, source);
    return null;
  }

  const statement = db.prepare(source);
  if (command === 'run') {
    const result = statement.run(...params);
    return {
      changes: result.changes,
      lastInsertRowId: Number(result.lastInsertRowid || 0),
      lastInsertRowid: Number(result.lastInsertRowid || 0),
    };
  }
  if (command === 'all') {
    return statement.all(...params);
  }
  return statement.get(...params) || null;
}

async function waitForTransactionTurn(clientId) {
  while (transactionOwner && transactionOwner !== clientId) {
    if (Date.now() - transactionTouchedAt > TRANSACTION_STALE_MS) {
      db.exec('ROLLBACK');
      transactionOwner = null;
      break;
    }
    await delay(20);
  }
}

function trackTransaction(clientId, source) {
  const normalized = source.trim().toUpperCase();
  if (normalized.startsWith('BEGIN')) {
    transactionOwner = clientId;
    transactionTouchedAt = Date.now();
    return;
  }
  if (transactionOwner === clientId) {
    transactionTouchedAt = Date.now();
    if (normalized.startsWith('COMMIT') || normalized.startsWith('ROLLBACK')) {
      transactionOwner = null;
    }
  }
}

function readJson(req) {
  return new Promise((resolveBody, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 10 * 1024 * 1024) {
        reject(new Error('Request body is too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      try {
        resolveBody(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, status, payload) {
  setCorsHeaders(res);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Accept');
}

function delay(ms) {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, ms));
}

function getDefaultDataDir() {
  if (process.platform === 'win32') {
    return join(process.env.APPDATA || tmpdir(), 'CollectionRead');
  }
  if (process.platform === 'darwin') {
    return join(process.env.HOME || tmpdir(), 'Library', 'Application Support', 'CollectionRead');
  }
  return join(process.env.XDG_DATA_HOME || join(process.env.HOME || tmpdir(), '.local', 'share'), 'collection-read');
}

function shutdown() {
  try {
    if (transactionOwner) {
      db.exec('ROLLBACK');
    }
    db.close();
  } finally {
    process.exit(0);
  }
}
