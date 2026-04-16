import { Router } from "express";
import { db, holidaysTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

router.get("/holidays", async (req, res, next) => {
  try {
    const { year } = req.query;
    const holidays = await db.select().from(holidaysTable);
    const filtered = year ? holidays.filter(h => h.date.startsWith(String(year))) : holidays;
    return res.json(filtered.sort((a, b) => a.date.localeCompare(b.date)));
  } catch (err) {
    next(err);
  }
});

router.post("/holidays", async (req, res, next) => {
  try {
    const me = await requireAuth(req);
    if (!me || me.role !== "admin") return res.status(403).json({ error: "Forbidden" });

    const { name, date, type, description } = req.body;
    const [holiday] = await db.insert(holidaysTable).values({ name, date, type, description: description || null }).returning();
    return res.status(201).json(holiday);
  } catch (err) {
    next(err);
  }
});

router.delete("/holidays/:id", async (req, res, next) => {
  try {
    const me = await requireAuth(req);
    if (!me || me.role !== "admin") return res.status(403).json({ error: "Forbidden" });

    await db.delete(holidaysTable).where(eq(holidaysTable.id, Number(req.params.id)));
    return res.json({ message: "Holiday deleted" });
  } catch (err) {
    next(err);
  }
});

export default router;
