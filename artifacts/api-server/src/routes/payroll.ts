import { Router } from "express";
import { db, payrollTable, employeesTable, attendanceTable, notificationsTable, reimbursementsTable, departmentsTable } from "@workspace/db";
import { eq, and, desc, gte, lte } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import * as XLSX from "xlsx";

const router = Router();

function calcIndianTax(annualSalary: number): number {
  if (annualSalary <= 250000) return 0;
  let tax = 0;
  if (annualSalary > 1000000) tax += (annualSalary - 1000000) * 0.20;
  if (annualSalary > 750000) tax += (Math.min(annualSalary, 1000000) - 750000) * 0.15;
  if (annualSalary > 500000) tax += (Math.min(annualSalary, 750000) - 500000) * 0.10;
  if (annualSalary > 250000) tax += (Math.min(annualSalary, 500000) - 250000) * 0.05;
  return tax / 12;
}

async function enrichPayroll(records: typeof payrollTable.$inferSelect[]) {
  const employees = await db.select().from(employeesTable);
  const depts = await db.select().from(departmentsTable);
  const empMap = Object.fromEntries(employees.map(e => [e.id, `${e.firstName} ${e.lastName}`]));
  const codeMap = Object.fromEntries(employees.map(e => [e.id, e.employeeCode]));
  const emailMap = Object.fromEntries(employees.map(e => [e.id, e.email]));
  const deptIdMap = Object.fromEntries(employees.map(e => [e.id, e.departmentId]));
  const deptNameMap = Object.fromEntries(depts.map(d => [d.id, d.name]));

  return records.map(r => ({
    ...r,
    employeeName: empMap[r.employeeId] || "Unknown",
    employeeCode: codeMap[r.employeeId] || "",
    employeeEmail: emailMap[r.employeeId] || "",
    departmentName: deptNameMap[deptIdMap[r.employeeId] ?? 0] || "N/A",
    basicSalary: Number(r.basicSalary),
    overtimeHours: Number(r.overtimeHours),
    overtimePay: Number(r.overtimePay),
    pfDeduction: Number(r.pfDeduction),
    taxDeduction: Number(r.taxDeduction),
    absentDeduction: Number(r.absentDeduction),
    reimbursementAmount: Number(r.reimbursementAmount),
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

router.get("/payroll/export", async (req, res, next) => {
  try {
    const me = await requireAuth(req);
    if (!me || me.role !== "admin") return res.status(403).json({ error: "Forbidden" });

    const { month, year } = req.query;
    const conditions = [];
    if (month) conditions.push(eq(payrollTable.month, Number(month)));
    if (year) conditions.push(eq(payrollTable.year, Number(year)));

    const records = conditions.length
      ? await db.select().from(payrollTable).where(and(...conditions)).orderBy(desc(payrollTable.createdAt))
      : await db.select().from(payrollTable).orderBy(desc(payrollTable.createdAt));

    const enriched = await enrichPayroll(records);

    const employees = await db.select().from(employeesTable);
    const empIdMap = Object.fromEntries(employees.map(e => [e.id, e]));

    const attMap: Record<number, { punchIn?: string; punchOut?: string; presentDays: number }> = {};
    if (month && year) {
      const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
      const endDate = new Date(Number(year), Number(month), 0).toISOString().split("T")[0];
      const attRecords = await db.select().from(attendanceTable);
      for (const a of attRecords) {
        if (a.date >= startDate && a.date <= endDate) {
          if (!attMap[a.employeeId]) attMap[a.employeeId] = { presentDays: 0 };
          if (a.punchIn && !attMap[a.employeeId].punchIn) {
            attMap[a.employeeId].punchIn = new Date(a.punchIn).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
          }
          if (a.punchOut) {
            attMap[a.employeeId].punchOut = new Date(a.punchOut).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
          }
          if (a.status === "present" || a.status === "late") attMap[a.employeeId].presentDays++;
        }
      }
    }

    const wsData = [
      ["Employee Name", "Employee ID", "Department", "Email", "Basic Pay (₹)", "PF Deduction (₹)", "Tax Deduction (₹)", "Absent Deduction (₹)", "Total Deductions (₹)", "Overtime Hours", "Overtime Pay (₹)", "Reimbursement (₹)", "Attendance Days", "Punch In", "Punch Out", "Net Salary (₹)", "Status"],
      ...enriched.map(p => {
        const att = attMap[p.employeeId] || {};
        return [
          p.employeeName,
          p.employeeCode,
          p.departmentName,
          p.employeeEmail,
          p.basicSalary.toFixed(2),
          p.pfDeduction.toFixed(2),
          p.taxDeduction.toFixed(2),
          p.absentDeduction.toFixed(2),
          p.deductions.toFixed(2),
          p.overtimeHours.toFixed(2),
          p.overtimePay.toFixed(2),
          p.reimbursementAmount.toFixed(2),
          p.presentDays,
          att.punchIn || "-",
          att.punchOut || "-",
          p.netSalary.toFixed(2),
          p.status,
        ];
      }),
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws["!cols"] = wsData[0].map(() => ({ wch: 20 }));
    XLSX.utils.book_append_sheet(wb, ws, "Payroll");
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    const monthName = month ? new Date(0, Number(month) - 1).toLocaleString("en-IN", { month: "long" }) : "all";
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="payroll-${monthName}-${year || "all"}.xlsx"`);
    res.send(buf);
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

router.put("/payroll/:id", async (req, res, next) => {
  try {
    const me = await requireAuth(req);
    if (!me || me.role !== "admin") return res.status(403).json({ error: "Forbidden" });

    const { status } = req.body;
    const [updated] = await db.update(payrollTable)
      .set({ status, paidAt: status === "paid" ? new Date() : undefined })
      .where(eq(payrollTable.id, Number(req.params.id)))
      .returning();

    if (!updated) return res.status(404).json({ error: "Not found" });

    if (status === "paid") {
      const emp = await db.select().from(employeesTable).where(eq(employeesTable.id, updated.employeeId)).limit(1);
      if (emp.length) {
        await db.insert(notificationsTable).values({
          employeeId: updated.employeeId,
          type: "payroll_processed",
          title: "Salary Credited",
          message: `Your salary for ${updated.month}/${updated.year} of ₹${Number(updated.netSalary).toFixed(2)} has been credited.`,
        });
      }
    }

    const enriched = await enrichPayroll([updated]);
    return res.json(enriched[0]);
  } catch (err) {
    next(err);
  }
});

router.post("/payroll", async (req, res, next) => {
  try {
    const me = await requireAuth(req);
    if (!me || me.role !== "admin") return res.status(403).json({ error: "Forbidden" });

    const { month, year, employeeIds } = req.body;

    const allActive = await db.select().from(employeesTable).where(eq(employeesTable.status, "active"));
    const targetEmployees = employeeIds?.length
      ? allActive.filter((e: typeof employeesTable.$inferSelect) => (employeeIds as number[]).includes(e.id))
      : allActive;

    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const endDate = new Date(year, month, 0).toISOString().split("T")[0];

    const results = [];
    for (const emp of targetEmployees) {
      if (!emp.salary) continue;

      const monthRecords = await db.select().from(attendanceTable)
        .where(eq(attendanceTable.employeeId, emp.id));

      const filtered = monthRecords.filter(r => r.date >= startDate && r.date <= endDate);
      const presentDays = filtered.filter(r => r.status === "present" || r.status === "late").length;
      const absentDays = filtered.filter(r => r.status === "absent").length;
      const leaveDays = filtered.filter(r => r.status === "on_leave").length;
      const workingDays = 26;
      const overtimeHours = filtered.reduce((sum, r) => sum + Number(r.overtime || 0), 0);

      const basicSalary = Number(emp.salary);
      const perDaySalary = basicSalary / workingDays;
      const absentDeduction = absentDays * perDaySalary;
      const pfDeduction = basicSalary * 0.12;
      const taxDeduction = calcIndianTax(basicSalary * 12);
      const hourlyRate = basicSalary / (workingDays * 9);
      const overtimePay = overtimeHours * hourlyRate * 2;

      const approvedReimb = await db.select().from(reimbursementsTable)
        .where(and(eq(reimbursementsTable.employeeId, emp.id), eq(reimbursementsTable.status, "approved")));
      const reimbursementAmount = approvedReimb.reduce((sum, r) => sum + Number(r.amount), 0);

      const deductions = absentDeduction + pfDeduction + taxDeduction;
      const netSalary = basicSalary - deductions + overtimePay + reimbursementAmount;

      const existing = await db.select().from(payrollTable)
        .where(and(eq(payrollTable.employeeId, emp.id), eq(payrollTable.month, month), eq(payrollTable.year, year)))
        .limit(1);

      let record;
      const payData = {
        basicSalary: String(basicSalary),
        workingDays,
        presentDays,
        absentDays,
        leaveDays,
        overtimeHours: String(overtimeHours.toFixed(2)),
        overtimePay: String(overtimePay.toFixed(2)),
        pfDeduction: String(pfDeduction.toFixed(2)),
        taxDeduction: String(taxDeduction.toFixed(2)),
        absentDeduction: String(absentDeduction.toFixed(2)),
        reimbursementAmount: String(reimbursementAmount.toFixed(2)),
        deductions: String(deductions.toFixed(2)),
        netSalary: String(netSalary.toFixed(2)),
        status: "processed",
      };

      if (existing.length) {
        [record] = await db.update(payrollTable).set(payData).where(eq(payrollTable.id, existing[0].id)).returning();
      } else {
        [record] = await db.insert(payrollTable).values({ employeeId: emp.id, month, year, ...payData }).returning();
        await db.insert(notificationsTable).values({
          employeeId: emp.id,
          type: "payroll_processed",
          title: "Payslip Generated",
          message: `Your payslip for ${month}/${year} has been generated. Net salary: ₹${netSalary.toFixed(2)}`,
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
