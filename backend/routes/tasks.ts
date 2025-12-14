// backend/routes/tasks.ts
import { Hono } from "npm:hono";
import { eq, and } from "npm:drizzle-orm";
import { jwt } from "npm:hono/jwt"; 
import { orm } from "../db/drizzle.ts";
import { tasks } from "../db/schema.ts";
import { saveDb } from "../db/connection.ts";
import { broadcast } from "../ws.ts";

export const tasksRoute = new Hono();


tasksRoute.use("/*", jwt({ secret: "cok-gizli-anahtar-123" }));


const getUserId = (c: any) => {
    const payload = c.get('jwtPayload');
    if (!payload) {
        
        throw new Error("Kullanıcı kimliği bulunamadı!"); 
    }
    return payload.id;
};

// GET: Sadece BANA ait görevleri getir
tasksRoute.get("/", async (c) => {
    try {
        const userId = getUserId(c);
        const q = (c.req.query("q") ?? "").toLowerCase();
        
        let rows = await orm.select().from(tasks).where(eq(tasks.userId, userId)).all();
        
        if (q) rows = rows.filter((r) => r.title.toLowerCase().includes(q));
        return c.json(rows);
    } catch (e) {
        return c.json({ error: "Unauthorized" }, 401);
    }
});


tasksRoute.post("/", async (c) => {
    try {
        const userId = getUserId(c);
        const body = await c.req.json().catch(() => ({}));
        const title = String(body.title ?? "").trim();
        if (!title) return c.json({ error: "title required" }, 400);

        const priority = (body.priority ?? "medium") as string;
        const status = (body.status ?? "todo") as string;
        const module = (body.module ?? null) as string | null;

        const inserted = await orm
            .insert(tasks)
            .values({ title, priority, status, module, userId })
            .returning()
            .get();

        await saveDb();
        
        broadcast(userId, "update");

        return c.json(inserted, 201);
    } catch (e) {
        return c.json({ error: "Unauthorized" }, 401);
    }
});

// PUT: Güncelleme
tasksRoute.put("/:id", async (c) => {
    try {
        const userId = getUserId(c);
        const id = Number(c.req.param("id"));
        const patch = await c.req.json().catch(() => ({}));
        
        const result = await orm.update(tasks)
            .set(patch)
            .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
            .run();
            
        await saveDb();

        if (result.changes === 0) return c.json({ error: "Not found" }, 404);
        
        const updated = await orm.select().from(tasks).where(eq(tasks.id, id)).get();
        broadcast(userId, "update");
        return c.json(updated);
    } catch (e) {
         return c.json({ error: "Unauthorized" }, 401);
    }
});


tasksRoute.delete("/:id", async (c) => {
    try {
        const userId = getUserId(c);
        const id = Number(c.req.param("id"));

        const result = await orm.delete(tasks)
            .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
            .run();
            
        await saveDb();

        if (result.changes === 0) return c.json({ error: "Not found" }, 404);

        broadcast(userId, "update");
        return c.json({ ok: true });
    } catch (e) {
        return c.json({ error: "Unauthorized" }, 401);
    }
});