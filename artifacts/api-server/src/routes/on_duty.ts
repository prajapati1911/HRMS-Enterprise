import { Router } from "express";
import { db, onDutyTable, employeesTable, attendanceTable, notificationsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

async function enrichOnDuty(records: typeof onDutyTable.$inferSelect[]) {
  const employees = await db.select().from(employeesTable);
  const empMap = Object.fromEntries(employees.map(e => [e.id, `${e.firstName} ${e.lastName}`]));
  return records.map(r => ({ ...r, employeeName: empMap[r.employeeId] || "Unknown" }));
}

router.get("/on-duty/my", async (req, res, next) => {
  try {
    const me = await requireAuth(req);
    if (!me) return res.status(401).json({ error: "Not authenticated" });

    const records = await db.select().from(onDutyTable)
      .where(eq(onDutyTable.employeeId, me.id))
      .orderBy(desc(onDutyTable.createdAt));

    return res.json(await enrichOnDuty(records));
  } catch (err) {
    next(err);
  }
});

router.get("/on-duty", async (req, res, next) => {
  try {
    const me = await requireAuth(req);
    if (!me || me.role !== "admin") return res.status(403).json({ error: "Forbidden" });

    const records = await db.select().from(onDutyTable)
      .orderBy(desc(onDutyTable.createdAt));

    return res.json(await enrichOnDuty(records));
  } catch (err) {
    next(err);
  }
});

router.post("/on-duty", async (req, res, next) => {
  try {
    const me = await requireAuth(req);
    if (!me) return res.status(401).json({ error: "Not authenticated" });

    const { date, reason, fromTime, toTime, location } = req.body;
    if (!date || !reason || !fromTime || !toTime) {
      return res.status(400).json({ error: "date, reason, fromTime, toTime are required" });
    }

    const [record] = await db.insert(onDutyTable).values({
      employeeId: me.id,
      date,
      reason,
      fromTime,
      toTime,
      location: location || null,
      status: "pending",
    }).returning();

    return res.status(201).json({ ...record, employeeName: `${me.firstName} ${me.lastName}` });
  } catch (err) {
    next(err);
  }
});

router.put("/on-duty/:id", async (req, res, next) => {
  try {
    const me = await requireAuth(req);
    if (!me || me.role !== "admin") return res.status(403).json({ error: "Forbidden" });

    const { status, rejectionReason } = req.body;
    if (!["approved", "rejected"].includes(status)) return res.status(400).json({ error: "Invalid status" });

    const [record] = await db.select().from(onDutyTable).where(eq(onDutyTable.id, Number(req.params.id))).limit(1);
    if (!record) return res.status(404).json({ error: "Not found" });

    const [updated] = await db.update(onDutyTable).set({
      status,
      approvedBy: me.id,
      approvedAt: new Date(),
      rejectionReason: rejectionReason || null,
    }).where(eq(onDutyTable.id, Number(req.params.id))).returning();

    if (status === "approved") {
      const existing = await db.select().from(attendanceTable)
        .where(and(eq(attendanceTable.employeeId, record.employeeId), eq(attendanceTable.date, record.date)))
        .limit(1);

      if (existing.length) {
        await db.update(attendanceTable).set({ status: "present", notes: `On-duty: ${record.reason}` })
          .where(eq(attendanceTable.id, existing[0].id));
      } else {
        await db.insert(attendanceTable).values({
          employeeId: record.employeeId,
          date: record.date,
          status: "present",
          notes: `On-duty approved: ${record.reason}`,
        });
      }
    }

    await db.insert(notificationsTable).values({
      employeeId: updated.employeeId,
      type: "general",
      title: `On-Duty Request ${status === "approved" ? "Approved" : "Rejected"}`,
      message: `Your on-duty request for ${updated.date} has been ${status}.${rejectionReason ? ` Reason: ${rejectionReason}` : ""}`,
    });

    const enriched = await enrichOnDuty([updated]);
    return res.json(enriched[0]);
  } catch (err) {
    next(err);
  }
});

export default router;
