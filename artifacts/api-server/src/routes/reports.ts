import { Router } from "express";
import { db, attendanceTable, leavesTable, employeesTable } from "@workspace/db";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

router.get("/reports/attendance", async (req, res, next) => {
  try {
    const me = await requireAuth(req);
    if (!me || me.role !== "admin") return res.status(403).json({ error: "Forbidden" });

    const now = new Date();
    const startDate = req.query.startDate ? String(req.query.startDate) : (() => {
      const d = new Date(now.getFullYear(), now.getMonth(), 1); return d.toISOString().split("T")[0];
    })();
    const endDate = req.query.endDate ? String(req.query.endDate) : now.toISOString().split("T")[0];

    const records = await db.select().from(attendanceTable)
      .where(and(gte(attendanceTable.date, startDate), lte(attendanceTable.date, endDate)));

    const employees = await db.select().from(employeesTable);
    const empMap = Object.fromEntries(employees.map(e => [e.id, `${e.firstName} ${e.lastName}`]));

    const dailyMap: Record<string, { present: number; absent: number; late: number }> = {};
    const empStats: Record<number, { presentDays: number; absentDays: number; lateDays: number; totalDays: number }> = {};

    for (const r of records) {
      if (!dailyMap[r.date]) dailyMap[r.date] = { present: 0, absent: 0, late: 0 };
      if (r.status === "present") dailyMap[r.date].present++;
      if (r.status === "absent") dailyMap[r.date].absent++;
      if (r.status === "late") { dailyMap[r.date].late++; dailyMap[r.date].present++; }

      if (!empStats[r.employeeId]) empStats[r.employeeId] = { presentDays: 0, absentDays: 0, lateDays: 0, totalDays: 0 };
      empStats[r.employeeId].totalDays++;
      if (r.status === "present" || r.status === "late") empStats[r.employeeId].presentDays++;
      if (r.status === "absent") empStats[r.employeeId].absentDays++;
      if (r.status === "late") empStats[r.employeeId].lateDays++;
    }

    const totalPresent = records.filter(r => r.status === "present" || r.status === "late").length;
    const totalAbsent = records.filter(r => r.status === "absent").length;
    const totalLate = records.filter(r => r.status === "late").length;
    const totalOvertime = records.reduce((sum, r) => sum + Number(r.overtime || 0), 0);
    const workingDays = Object.keys(dailyMap).length;
    const avgAttendance = workingDays > 0 ? (totalPresent / (employees.length * workingDays)) * 100 : 0;

    return res.json({
      startDate,
      endDate,
      summary: {
        totalWorkingDays: workingDays,
        averageAttendance: Math.round(avgAttendance),
        totalPresent,
        totalAbsent,
        totalLate,
        totalOvertime: Math.round(totalOvertime * 10) / 10,
      },
      dailyBreakdown: Object.entries(dailyMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, stats]) => ({ date, ...stats })),
      employeeBreakdown: Object.entries(empStats)
        .map(([empId, stats]) => ({
          employeeId: Number(empId),
          employeeName: empMap[Number(empId)] || "Unknown",
          ...stats,
          attendancePercentage: stats.totalDays > 0 ? Math.round((stats.presentDays / stats.totalDays) * 100) : 0,
        })),
    });
  } catch (err) {
    next(err);
  }
});

router.get("/reports/leave", async (req, res, next) => {
  try {
    const me = await requireAuth(req);
    if (!me || me.role !== "admin") return res.status(403).json({ error: "Forbidden" });

    const now = new Date();
    const startDate = req.query.startDate ? String(req.query.startDate) : (() => {
      return `${now.getFullYear()}-01-01`;
    })();
    const endDate = req.query.endDate ? String(req.query.endDate) : now.toISOString().split("T")[0];

    const records = await db.select().from(leavesTable)
      .where(and(gte(leavesTable.startDate, startDate), lte(leavesTable.startDate, endDate)));

    const byType: Record<string, { count: number; days: number }> = {};
    for (const r of records) {
      if (!byType[r.type]) byType[r.type] = { count: 0, days: 0 };
      byType[r.type].count++;
      byType[r.type].days += Number(r.days);
    }

    return res.json({
      startDate,
      endDate,
      totalRequests: records.length,
      approved: records.filter(r => r.status === "approved").length,
      rejected: records.filter(r => r.status === "rejected").length,
      pending: records.filter(r => r.status === "pending").length,
      byType: Object.entries(byType).map(([type, stats]) => ({ type, ...stats })),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
