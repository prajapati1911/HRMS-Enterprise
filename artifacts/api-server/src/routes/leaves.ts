import { Router } from "express";
import { db, leavesTable, leaveBalancesTable, employeesTable, notificationsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

async function ensureLeaveBalance(employeeId: number, year: number) {
  const existing = await db.select().from(leaveBalancesTable)
    .where(and(eq(leaveBalancesTable.employeeId, employeeId), eq(leaveBalancesTable.year, year)))
    .limit(1);
  
  if (!existing.length) {
    await db.insert(leaveBalancesTable).values({ employeeId, year });
  }
  return existing[0] || (await db.select().from(leaveBalancesTable)
    .where(and(eq(leaveBalancesTable.employeeId, employeeId), eq(leaveBalancesTable.year, year)))
    .limit(1))[0];
}

async function enrichLeaves(records: typeof leavesTable.$inferSelect[]) {
  const employees = await db.select().from(employeesTable);
  const empMap = Object.fromEntries(employees.map(e => [e.id, `${e.firstName} ${e.lastName}`]));
  const codeMap = Object.fromEntries(employees.map(e => [e.id, e.employeeCode]));
  const approverMap = Object.fromEntries(employees.map(e => [e.id, `${e.firstName} ${e.lastName}`]));

  return records.map(r => ({
    ...r,
    employeeName: empMap[r.employeeId] || "Unknown",
    employeeCode: codeMap[r.employeeId] || "",
    approverName: r.approvedBy ? approverMap[r.approvedBy] : null,
    days: Number(r.days),
  }));
}

router.get("/leaves", async (req, res, next) => {
  try {
    const me = await requireAuth(req);
    if (!me) return res.status(401).json({ error: "Not authenticated" });

    const { status, employeeId, type } = req.query;
    
    let query = db.select().from(leavesTable);
    const conditions = [];
    
    if (me.role !== "admin") {
      conditions.push(eq(leavesTable.employeeId, me.id));
    } else if (employeeId) {
      conditions.push(eq(leavesTable.employeeId, Number(employeeId)));
    }
    
    if (status) conditions.push(eq(leavesTable.status, String(status)));
    if (type) conditions.push(eq(leavesTable.type, String(type)));

    const records = conditions.length
      ? await db.select().from(leavesTable).where(and(...conditions)).orderBy(desc(leavesTable.createdAt))
      : await db.select().from(leavesTable).orderBy(desc(leavesTable.createdAt));

    return res.json(await enrichLeaves(records));
  } catch (err) {
    next(err);
  }
});

router.post("/leaves", async (req, res, next) => {
  try {
    const me = await requireAuth(req);
    if (!me) return res.status(401).json({ error: "Not authenticated" });

    const { type, startDate, endDate, reason } = req.body;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const [leave] = await db.insert(leavesTable).values({
      employeeId: me.id,
      type,
      startDate,
      endDate,
      days: String(days),
      reason,
      status: "pending",
    }).returning();

    return res.status(201).json((await enrichLeaves([leave]))[0]);
  } catch (err) {
    next(err);
  }
});

router.get("/leaves/balance/my", async (req, res, next) => {
  try {
    const me = await requireAuth(req);
    if (!me) return res.status(401).json({ error: "Not authenticated" });

    const year = new Date().getFullYear();
    const balance = await ensureLeaveBalance(me.id, year);

    return res.json({
      employeeId: me.id,
      year,
      casual: { total: Number(balance.casualTotal), used: Number(balance.casualUsed), remaining: Number(balance.casualTotal) - Number(balance.casualUsed) },
      paid: { total: Number(balance.paidTotal), used: Number(balance.paidUsed), remaining: Number(balance.paidTotal) - Number(balance.paidUsed) },
      sick: { total: Number(balance.sickTotal), used: Number(balance.sickUsed), remaining: Number(balance.sickTotal) - Number(balance.sickUsed) },
      rh: { total: Number(balance.rhTotal), used: Number(balance.rhUsed), remaining: Number(balance.rhTotal) - Number(balance.rhUsed) },
      maternity: { total: Number(balance.maternityTotal), used: Number(balance.maternityUsed), remaining: Number(balance.maternityTotal) - Number(balance.maternityUsed) },
      paternity: { total: Number(balance.paternityTotal), used: Number(balance.paternityUsed), remaining: Number(balance.paternityTotal) - Number(balance.paternityUsed) },
    });
  } catch (err) {
    next(err);
  }
});

router.get("/leaves/balance/:employeeId", async (req, res, next) => {
  try {
    const me = await requireAuth(req);
    if (!me || me.role !== "admin") return res.status(403).json({ error: "Forbidden" });

    const employeeId = Number(req.params.employeeId);
    const year = new Date().getFullYear();
    const balance = await ensureLeaveBalance(employeeId, year);

    return res.json({
      employeeId,
      year,
      casual: { total: Number(balance.casualTotal), used: Number(balance.casualUsed), remaining: Number(balance.casualTotal) - Number(balance.casualUsed) },
      paid: { total: Number(balance.paidTotal), used: Number(balance.paidUsed), remaining: Number(balance.paidTotal) - Number(balance.paidUsed) },
      sick: { total: Number(balance.sickTotal), used: Number(balance.sickUsed), remaining: Number(balance.sickTotal) - Number(balance.sickUsed) },
      rh: { total: Number(balance.rhTotal), used: Number(balance.rhUsed), remaining: Number(balance.rhTotal) - Number(balance.rhUsed) },
      maternity: { total: Number(balance.maternityTotal), used: Number(balance.maternityUsed), remaining: Number(balance.maternityTotal) - Number(balance.maternityUsed) },
      paternity: { total: Number(balance.paternityTotal), used: Number(balance.paternityUsed), remaining: Number(balance.paternityTotal) - Number(balance.paternityUsed) },
    });
  } catch (err) {
    next(err);
  }
});

router.get("/leaves/:id", async (req, res, next) => {
  try {
    const me = await requireAuth(req);
    if (!me) return res.status(401).json({ error: "Not authenticated" });

    const id = Number(req.params.id);
    const records = await db.select().from(leavesTable).where(eq(leavesTable.id, id)).limit(1);
    if (!records.length) return res.status(404).json({ error: "Leave not found" });

    return res.json((await enrichLeaves(records))[0]);
  } catch (err) {
    next(err);
  }
});

router.put("/leaves/:id", async (req, res, next) => {
  try {
    const me = await requireAuth(req);
    if (!me) return res.status(401).json({ error: "Not authenticated" });

    const id = Number(req.params.id);
    const { status, rejectionReason } = req.body;

    const existing = await db.select().from(leavesTable).where(eq(leavesTable.id, id)).limit(1);
    if (!existing.length) return res.status(404).json({ error: "Leave not found" });

    const updates: Record<string, unknown> = { status };
    if (me.role === "admin" && (status === "approved" || status === "rejected")) {
      updates.approvedBy = me.id;
      updates.approvedAt = new Date();
    }
    if (rejectionReason) updates.rejectionReason = rejectionReason;

    const [leave] = await db.update(leavesTable).set(updates).where(eq(leavesTable.id, id)).returning();

    // Update leave balance if approved
    if (status === "approved" && me.role === "admin") {
      const year = new Date(existing[0].startDate).getFullYear();
      const balance = await ensureLeaveBalance(existing[0].employeeId, year);
      const days = Number(existing[0].days);
      const type = existing[0].type;
      
      const colMap: Record<string, string> = {
        casual: "casualUsed", paid: "paidUsed", sick: "sickUsed",
        rh: "rhUsed", maternity: "maternityUsed", paternity: "paternityUsed",
      };
      const col = colMap[type];
      if (col) {
        await db.update(leaveBalancesTable)
          .set({ [col]: String(Number((balance as Record<string, unknown>)[col] || 0) + days) })
          .where(and(eq(leaveBalancesTable.employeeId, existing[0].employeeId), eq(leaveBalancesTable.year, year)));
      }

      // Create notification
      await db.insert(notificationsTable).values({
        employeeId: existing[0].employeeId,
        type: "leave_approved",
        title: "Leave Request Approved",
        message: `Your ${type} leave request from ${existing[0].startDate} to ${existing[0].endDate} has been approved.`,
      });
    } else if (status === "rejected") {
      await db.insert(notificationsTable).values({
        employeeId: existing[0].employeeId,
        type: "leave_rejected",
        title: "Leave Request Rejected",
        message: `Your ${existing[0].type} leave request has been rejected. ${rejectionReason || ""}`,
      });
    }

    return res.json((await enrichLeaves([leave]))[0]);
  } catch (err) {
    next(err);
  }
});

export default router;
