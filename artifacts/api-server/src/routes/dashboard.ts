import { Router } from "express";
import { db, attendanceTable, leavesTable, employeesTable, payrollTable, notificationsTable } from "@workspace/db";
import { eq, and, desc, gte } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

router.get("/dashboard/admin", async (req, res, next) => {
  try {
    const me = await requireAuth(req);
    if (!me || me.role !== "admin") return res.status(403).json({ error: "Forbidden" });

    const today = new Date().toISOString().split("T")[0];
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const [allEmployees, todayRecords, pendingLeaves, payrollRecords, departments] = await Promise.all([
      db.select().from(employeesTable).where(eq(employeesTable.status, "active")),
      db.select().from(attendanceTable).where(eq(attendanceTable.date, today)),
      db.select().from(leavesTable).where(eq(leavesTable.status, "pending")),
      db.select().from(payrollTable).where(and(eq(payrollTable.month, month), eq(payrollTable.year, year))),
      db.select().from(notificationsTable).orderBy(desc(notificationsTable.createdAt)).limit(10),
    ]);

    const present = todayRecords.filter(r => r.status === "present" || r.status === "late").length;
    const absent = allEmployees.length - present - todayRecords.filter(r => r.status === "on_leave").length;
    const late = todayRecords.filter(r => r.status === "late").length;
    const onLeave = todayRecords.filter(r => r.status === "on_leave").length;

    const monthlyPayroll = payrollRecords.reduce((sum, r) => sum + Number(r.netSalary), 0);

    // Trend for last 14 days
    const trendDays = 14;
    const trend = [];
    for (let i = trendDays - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const dayRecords = await db.select().from(attendanceTable).where(eq(attendanceTable.date, dateStr));
      const dayPresent = dayRecords.filter(r => r.status === "present" || r.status === "late").length;
      trend.push({
        date: dateStr,
        presentPercent: allEmployees.length > 0 ? Math.round((dayPresent / allEmployees.length) * 100) : 0,
      });
    }

    // Department attendance breakdown
    const allEmps = await db.select().from(employeesTable);
    const deptBuckets: Record<string, { present: number; total: number; name: string }> = {};
    for (const e of allEmps) {
      const key = String(e.departmentId || 0);
      if (!deptBuckets[key]) deptBuckets[key] = { present: 0, total: 0, name: "No Department" };
      deptBuckets[key].total++;
      const rec = todayRecords.find(r => r.employeeId === e.id);
      if (rec && (rec.status === "present" || rec.status === "late")) deptBuckets[key].present++;
    }

    return res.json({
      todayStats: {
        present,
        absent: Math.max(0, absent),
        late,
        onLeave,
        total: allEmployees.length,
      },
      pendingLeaves: pendingLeaves.length,
      totalEmployees: allEmployees.length,
      monthlyPayroll,
      attendanceTrend: trend,
      recentActivities: departments,
      departmentWiseAttendance: Object.values(deptBuckets).map(d => ({
        departmentName: d.name,
        present: d.present,
        total: d.total,
      })),
    });
  } catch (err) {
    next(err);
  }
});

router.get("/dashboard/employee", async (req, res, next) => {
  try {
    const me = await requireAuth(req);
    if (!me) return res.status(401).json({ error: "Not authenticated" });

    const today = new Date().toISOString().split("T")[0];
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const startOfMonth = `${year}-${String(month).padStart(2, "0")}-01`;

    const [todayRecord, monthRecords, pendingLeaves, leaveBalance, payslip, notifications] = await Promise.all([
      db.select().from(attendanceTable).where(and(eq(attendanceTable.employeeId, me.id), eq(attendanceTable.date, today))).limit(1),
      db.select().from(attendanceTable).where(and(eq(attendanceTable.employeeId, me.id), gte(attendanceTable.date, startOfMonth))),
      db.select().from(leavesTable).where(and(eq(leavesTable.employeeId, me.id), eq(leavesTable.status, "pending"))),
      db.select().from(attendanceTable).where(eq(attendanceTable.employeeId, me.id)).orderBy(desc(attendanceTable.date)).limit(7),
      db.select().from(payrollTable).where(and(eq(payrollTable.employeeId, me.id), eq(payrollTable.month, month), eq(payrollTable.year, year))).limit(1),
      db.select().from(notificationsTable).where(eq(notificationsTable.employeeId, me.id)).orderBy(desc(notificationsTable.createdAt)).limit(5),
    ]);

    const presentDays = monthRecords.filter(r => r.status === "present" || r.status === "late").length;
    const absentDays = monthRecords.filter(r => r.status === "absent").length;
    const lateDays = monthRecords.filter(r => r.status === "late").length;
    const workingHours = monthRecords.reduce((sum, r) => sum + Number(r.workingHours || 0), 0);
    const overtimeHours = monthRecords.reduce((sum, r) => sum + Number(r.overtime || 0), 0);

    const today_att = todayRecord[0] || { id: 0, employeeId: me.id, date: today, status: "absent" };

    // Build leave balance inline
    const leaveBalanceData = {
      employeeId: me.id,
      year,
      casual: { total: 12, used: 0, remaining: 12 },
      paid: { total: 15, used: 0, remaining: 15 },
      sick: { total: 10, used: 0, remaining: 10 },
      rh: { total: 3, used: 0, remaining: 3 },
      maternity: { total: 0, used: 0, remaining: 0 },
      paternity: { total: 0, used: 0, remaining: 0 },
    };

    return res.json({
      todayAttendance: {
        ...today_att,
        employeeName: `${me.firstName} ${me.lastName}`,
        workingHours: today_att.workingHours ? Number(today_att.workingHours) : null,
        overtime: Number(today_att.overtime || 0),
      },
      leaveBalance: leaveBalanceData,
      monthSummary: {
        presentDays,
        absentDays,
        lateDays,
        workingHours: Math.round(workingHours * 10) / 10,
        overtimeHours: Math.round(overtimeHours * 10) / 10,
      },
      recentAttendance: leaveBalance.map(r => ({
        ...r,
        employeeName: `${me.firstName} ${me.lastName}`,
        workingHours: r.workingHours ? Number(r.workingHours) : null,
        overtime: Number(r.overtime || 0),
      })),
      pendingLeaves: pendingLeaves.map(l => ({ ...l, days: Number(l.days), employeeName: `${me.firstName} ${me.lastName}` })),
      notifications,
      payslip: payslip[0] ? {
        ...payslip[0],
        basicSalary: Number(payslip[0].basicSalary),
        overtimeHours: Number(payslip[0].overtimeHours),
        overtimePay: Number(payslip[0].overtimePay),
        deductions: Number(payslip[0].deductions),
        netSalary: Number(payslip[0].netSalary),
      } : null,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
