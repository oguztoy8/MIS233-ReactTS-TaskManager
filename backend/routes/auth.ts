// backend/routes/auth.ts
import { Hono } from "npm:hono";
import { eq } from "npm:drizzle-orm";
import { sign } from "npm:hono/jwt"; // İmzalama fonksiyonu
import { orm } from "../db/drizzle.ts";
import { users } from "../db/schema.ts";
import { saveDb } from "../db/connection.ts";

export const authRoute = new Hono();
const JWT_SECRET = "cok-gizli-anahtar-123";

authRoute.post("/register", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const username = String(body.username || "").trim();
  const password = String(body.password || "").trim();

  if (!username || !password) return c.json({ error: "Username/Password required" }, 400);

  const existingUser = await orm.select().from(users).where(eq(users.username, username)).get();
  if (existingUser) return c.json({ error: "Username taken" }, 409);

  const newUser = await orm.insert(users).values({ username, password }).returning().get();
  await saveDb();

  return c.json({ message: "Registered!", user: { id: newUser.id, username: newUser.username } }, 201);
});

authRoute.post("/login", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const username = String(body.username || "").trim();
  const password = String(body.password || "").trim();

  const user = await orm.select().from(users).where(eq(users.username, username)).get();

  if (!user || user.password !== password) {
    return c.json({ error: "Invalid credentials" }, 401);
  }

  // Token oluştur
  const payload = {
    id: user.id,
    username: user.username,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24 saat
  };
  
  const token = await sign(payload, JWT_SECRET);

  return c.json({ 
    message: "Login successful!", 
    token: token,
    user: { id: user.id, username: user.username } 
  });
});