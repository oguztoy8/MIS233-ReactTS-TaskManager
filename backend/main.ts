// backend/main.ts
import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { upgradeWebSocket } from "npm:hono/deno";
import { orm } from "./db/drizzle.ts";
import { saveDb } from "./db/connection.ts";
import { migrate } from "npm:drizzle-orm/sql-js/migrator";
import { logger } from "./middleware/logger.ts";
import { tasksRoute } from "./routes/tasks.ts";
import { authRoute } from "./routes/auth.ts";
import { addClient } from "./ws.ts";
import { DB_URL, PORT } from "./config/env.ts";

console.log(`DB_URL = ${DB_URL}`);
console.log(`Server starting on port ${PORT}`);

try {
    await migrate(orm, { migrationsFolder: "./db/migrations" });
    console.log("Migrations applied.");
} catch (e) {
     console.warn("Migrations skipped.");
} finally {
    await saveDb();
}

const app = new Hono();

app.use("*", cors({
  origin: "*",
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowHeaders: ["content-type", "authorization"],
  exposeHeaders: ["location"],
}));

app.use("*", logger);


app.route("/api/auth", authRoute);


app.get('/ws', upgradeWebSocket((c) => {
    const url = new URL(c.req.url);
    const token = url.searchParams.get('token');
    let userId = 0;
    try {
        if(token) {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const payload = JSON.parse(atob(base64));
            userId = payload.id;
        }
    } catch(e) { console.log("WS Token Error", e)}

    return {
      onOpen(_event, ws) {
        if (userId > 0) {
            console.log(`WebSocket connected: User ${userId}`);
            addClient(userId, ws.raw as WebSocket);
        } else {
            ws.close();
        }
      },
      onMessage(event, ws) { console.log(event.data); },
      onClose: () => { console.log("WebSocket closed"); },
    }
}));


app.route("/api/tasks", tasksRoute);

app.get("/api/hello", (c) => c.json({ msg: "Hello from Hono + sql.js ✅" }));

Deno.serve({ port: 8000 }, app.fetch);
console.log("Hono server running at http://localhost:8000");