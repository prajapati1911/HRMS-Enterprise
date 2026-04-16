import { Router } from "express";
import { db, notificationsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

router.get("/notifications", async (req, res, next) => {
  try {
    const me = await requireAuth(req);
    if (!me) return res.status(401).json({ error: "Not authenticated" });

    const { unread } = req.query;
    const conditions = [eq(notificationsTable.employeeId, me.id)];
    if (unread === "true") conditions.push(eq(notificationsTable.isRead, false));

    const notifications = await db.select().from(notificationsTable)
      .where(and(...conditions))
      .orderBy(desc(notificationsTable.createdAt))
      .limit(50);

    return res.json(notifications);
  } catch (err) {
    next(err);
  }
});

router.put("/notifications/:id/read", async (req, res, next) => {
  try {
    const me = await requireAuth(req);
    if (!me) return res.status(401).json({ error: "Not authenticated" });

    await db.update(notificationsTable)
      .set({ isRead: true })
      .where(and(eq(notificationsTable.id, Number(req.params.id)), eq(notificationsTable.employeeId, me.id)));

    return res.json({ message: "Marked as read" });
  } catch (err) {
    next(err);
  }
});

router.put("/notifications/read-all", async (req, res, next) => {
  try {
    const me = await requireAuth(req);
    if (!me) return res.status(401).json({ error: "Not authenticated" });

    await db.update(notificationsTable)
      .set({ isRead: true })
      .where(eq(notificationsTable.employeeId, me.id));

    return res.json({ message: "All marked as read" });
  } catch (err) {
    next(err);
  }
});

export default router;
