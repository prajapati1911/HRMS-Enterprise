import { Router } from "express";
import { db, payrollTable, employeesTable, attendanceTable, notificationsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

async function enrichPayroll(records: typeof payrollTable.$inferSelect[]) {
  const employees = await db.select().from(employeesTable);
  const empMap = Object.fromEntries(employees.map(e => [e.id, `${e.firstName} ${e.lastName}`]));
  const codeMap = Object.fromEntries(employees.map(e => [e.id, e.employeeCode]));

  return records.map(r => ({
    ...r,
    employeeName: empMap[r.employeeId] || "Unknown",
    employeeCode: codeMap[r.employeeId] || "",
    basicSalary: Number(r.basicSalary),
    overtimeHours: Number(r.overtimeHours),
    overtimePay: Number(r.overtimePay),
    deductions: Number(r.deductions),
    netSalary: Number(r.netSalary),
  }));
}

router.get("/payroll/my", async (req, res, next) => {
  try {
    const me = await requireAuth(req);
    if (!me) return res.status(401).json({ error: "Not authenticated" });

    const records = await db.select().from(payrollTable)
      .where(eq(payrollTable.employeeId, me.id))
      .orderBy(desc(payrollTable.year), desc(payrollTable.month));

    return res.json(await enrichPayroll(records));
  } catch (err) {
    next(err);
  }
});

router.get("/payroll/summary", async (req, res, next) => {
  try {
    const me = await requireAuth(req);
    if (!me || me.role !== "admin") return res.status(403).json({ error: "Forbidden" });

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const records = await db.select().from(payrollTable)
      .where(and(eq(payrollTable.month, month), eq(payrollTable.year, year)));

    const totalPayroll = records.reduce((sum, r) => sum + Number(r.netSalary), 0);

    return res.json({
      month,
      year,
      totalPayroll,
      totalEmployees: records.length,
      processed: records.filter(r => r.status === "processed").length,
      pending: records.filter(r => r.status === "draft").length,
      paid: records.filter(r => r.status === "paid").length,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/payroll", async (req, res, next) => {
  try {
    const me = await requireAuth(req);
    if (!me || me.role !== "admin") return res.status(403).json({ error: "Forbidden" });

    const { employeeId, month, year } = req.query;
    const conditions = [];
    if (employeeId) conditions.push(eq(payrollTable.employeeId, Number(employeeId)));
    if (month) conditions.push(eq(payrollTable.month, Number(month)));
    if (year) conditions.push(eq(payrollTable.year, Number(year)));

    const records = conditions.length
      ? await db.select().from(payrollTable).where(and(...conditions)).orderBy(desc(payrollTable.createdAt))
      : await db.select().from(payrollTable).orderBy(desc(payrollTable.createdAt));

    return res.json(await enrichPayroll(records));
  } catch (err) {
    next(err);
  }
});

router.post("/payroll", async (req, res, next) => {
  try {
    const me = await requireAuth(req);
    if (!me || me.role !== "admin") return res.status(403).json({ error: "Forbidden" });

    const { month, year, employeeIds } = req.body;

    const employees = employeeIds?.length
      ? await db.select().from(employeesTable).where(eq(employeesTable.status, "active"))
      : await db.select().from(employeesTable).where(eq(employeesTable.status, "active"));

    const targetEmployees = employeeIds?.length
      ? employees.filter((e: typeof employeesTable.$inferSelect) => (employeeIds as number[]).includes(e.id))
      : employees;

    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const endDate = new Date(year, month, 0).toISOString().split("T")[0];

    const results = [];
    for (const emp of targetEmployees) {
      if (!emp.salary) continue;

      const attRecords = await db.select().from(attendanceTable)
        .where(and(
          eq(attendanceTable.employeeId, emp.id),
          eq(attendanceTable.date, startDate)
        ));

      const monthRecords = await db.select().from(attendanceTable)
        .where(eq(attendanceTable.employeeId, emp.id));

      const presentDays = monthRecords.filter(r => r.status === "present" || r.status === "late").length;
      const absentDays = monthRecords.filter(r => r.status === "absent").length;
      const leaveDays = monthRecords.filter(r => r.status === "on_leave").length;
      const workingDays = 26;
      const overtimeHours = monthRecords.reduce((sum, r) => sum + Number(r.overtime || 0), 0);

      const basicSalary = Number(emp.salary);
      const perDaySalary = basicSalary / workingDays;
      const deductions = absentDays * perDaySalary;
      const overtimePay = overtimeHours * (basicSalary / (workingDays * 9)) * 1.5;
      const netSalary = basicSalary - deductions + overtimePay;

      // Check for existing
      const existing = await db.select().from(payrollTable)
        .where(and(eq(payrollTable.employeeId, emp.id), eq(payrollTable.month, month), eq(payrollTable.year, year)))
        .limit(1);

      let record;
      if (existing.length) {
        [record] = await db.update(payrollTable).set({
          basicSalary: String(basicSalary),
          workingDays,
          presentDays,
          absentDays,
          leaveDays,
          overtimeHours: String(overtimeHours.toFixed(2)),
          overtimePay: String(overtimePay.toFixed(2)),
          deductions: String(deductions.toFixed(2)),
          netSalary: String(netSalary.toFixed(2)),
          status: "processed",
        }).where(eq(payrollTable.id, existing[0].id)).returning();
      } else {
        [record] = await db.insert(payrollTable).values({
          employeeId: emp.id,
          month,
          year,
          basicSalary: String(basicSalary),
          workingDays,
          presentDays,
          absentDays,
          leaveDays,
          overtimeHours: String(overtimeHours.toFixed(2)),
          overtimePay: String(overtimePay.toFixed(2)),
          deductions: String(deductions.toFixed(2)),
          netSalary: String(netSalary.toFixed(2)),
          status: "processed",
        }).returning();

        await db.insert(notificationsTable).values({
          employeeId: emp.id,
          type: "payroll_processed",
          title: "Payslip Generated",
          message: `Your payslip for ${month}/${year} has been generated. Net salary: $${netSalary.toFixed(2)}`,
        });
      }

      results.push(record);
    }

    return res.json(await enrichPayroll(results));
  } catch (err) {
    next(err);
  }
});

export default router;
