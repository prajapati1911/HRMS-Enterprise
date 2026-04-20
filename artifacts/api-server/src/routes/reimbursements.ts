import { Router } from "express";
import { db, reimbursementsTable, employeesTable, notificationsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

async function enrichReimb(records: typeof reimbursementsTable.$inferSelect[]) {
  const employees = await db.select().from(employeesTable);
  const empMap = Object.fromEntries(employees.map(e => [e.id, `${e.firstName} ${e.lastName}`]));
  return records.map(r => ({ ...r, employeeName: empMap[r.employeeId] || "Unknown", amount: Number(r.amount) }));
}

router.get("/reimbursements/my", async (req, res, next) => {
  try {
    const me = await requireAuth(req);
    if (!me) return res.status(401).json({ error: "Not authenticated" });

    const records = await db.select().from(reimbursementsTable)
      .where(eq(reimbursementsTable.employeeId, me.id))
      .orderBy(desc(reimbursementsTable.createdAt));

    return res.json(await enrichReimb(records));
  } catch (err) {
    next(err);
  }
});

router.get("/reimbursements", async (req, res, next) => {
  try {
    const me = await requireAuth(req);
    if (!me || me.role !== "admin") return res.status(403).json({ error: "Forbidden" });

    const records = await db.select().from(reimbursementsTable)
      .orderBy(desc(reimbursementsTable.createdAt));

    return res.json(await enrichReimb(records));
  } catch (err) {
    next(err);
  }
});

router.post("/reimbursements", async (req, res, next) => {
  try {
    const me = await requireAuth(req);
    if (!me) return res.status(401).json({ error: "Not authenticated" });

    const { title, amount, description, receiptUrl } = req.body;
    if (!title || !amount) return res.status(400).json({ error: "title and amount are required" });

    const [record] = await db.insert(reimbursementsTable).values({
      employeeId: me.id,
      title,
      amount: String(Number(amount).toFixed(2)),
      description: description || null,
      receiptUrl: receiptUrl || null,
      status: "pending",
    }).returning();

    return res.status(201).json({ ...record, amount: Number(record.amount), employeeName: `${me.firstName} ${me.lastName}` });
  } catch (err) {
    next(err);
  }
});

router.put("/reimbursements/:id", async (req, res, next) => {
  try {
    const me = await requireAuth(req);
    if (!me || me.role !== "admin") return res.status(403).json({ error: "Forbidden" });

    const { status, rejectionReason } = req.body;
    if (!["approved", "rejected"].includes(status)) return res.status(400).json({ error: "Invalid status" });

    const [updated] = await db.update(reimbursementsTable).set({
      status,
      approvedBy: me.id,
      approvedAt: new Date(),
      rejectionReason: rejectionReason || null,
    }).where(eq(reimbursementsTable.id, Number(req.params.id))).returning();

    if (!updated) return res.status(404).json({ error: "Not found" });

    await db.insert(notificationsTable).values({
      employeeId: updated.employeeId,
      type: "general",
      title: `Reimbursement ${status === "approved" ? "Approved" : "Rejected"}`,
      message: `Your reimbursement request "${updated.title}" of ₹${Number(updated.amount).toFixed(2)} has been ${status}.${rejectionReason ? ` Reason: ${rejectionReason}` : ""}`,
    });

    const enriched = await enrichReimb([updated]);
    return res.json(enriched[0]);
  } catch (err) {
    next(err);
  }
});

export default router;
