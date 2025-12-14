// backend/db/connection.ts
import initSqlJs from "sql.js";

const wasmUrl = import.meta.resolve("sql.js/dist/sql-wasm.wasm");
const SQL = await initSqlJs({
  locateFile: () => wasmUrl,
});

const DB_FILE = "./db/tasks.db";

try { await Deno.mkdir("./db", { recursive: true }); } catch {}

let initial: Uint8Array | null = null;
try {
  initial = await Deno.readFile(DB_FILE);
} catch {
  initial = null;
}

export const sqlDb = initial ? new SQL.Database(initial) : new SQL.Database();


sqlDb.run(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    status TEXT DEFAULT 'todo',
    priority TEXT DEFAULT 'medium',
    module TEXT,
    user_id INTEGER NOT NULL,
    created_at INTEGER DEFAULT (strftime('%s','now'))
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
  );
`);

export async function saveDb() {
  const data = sqlDb.export();
  await Deno.writeFile(DB_FILE, data);
}

console.log("🗄️ sql.js ready →", DB_FILE);