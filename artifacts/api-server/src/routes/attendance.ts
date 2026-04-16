import { Router } from "express";
import { db, attendanceTable, employeesTable, geofencesTable } from "@workspace/db";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

function calcDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const phi1 = lat1 * Math.PI / 180;
  const phi2 = lat2 * Math.PI / 180;
  const dphi = (lat2 - lat1) * Math.PI / 180;
  const dlambda = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dphi/2)**2 + Math.cos(phi1)*Math.cos(phi2)*Math.sin(dlambda/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

async function checkGeofence(lat: number, lon: number): Promise<boolean> {
  const fences = await db.select().from(geofencesTable).where(eq(geofencesTable.isActive, true));
  if (!fences.length) return true; // no fences configured = allow all
  return fences.some(f => calcDistance(lat, lon, Number(f.latitude), Number(f.longitude)) <= Number(f.radius));
}

async function enrichAttendance(records: typeof attendanceTable.$inferSelect[]) {
  const empIds = [...new Set(records.map(r => r.employeeId))];
  const employees = empIds.length ? await db.select().from(employeesTable).where(
    empIds.length === 1 ? eq(employeesTable.id, empIds[0]) : undefined
  ) : [];
  const empMap = Object.fromEntries(employees.map(e => [e.id, `${e.firstName} ${e.lastName}`]));
  const codeMap = Object.fromEntries(employees.map(e => [e.id, e.employeeCode]));
  
  return records.map(r => ({
    ...r,
    employeeName: empMap[r.employeeId] || "Unknown",
    employeeCode: codeMap[r.employeeId] || "",
    workingHours: r.workingHours ? Number(r.workingHours) : null,
    overtime: r.overtime ? Number(r.overtime) : 0,
  }));
}

router.post("/attendance/punch-in", async (req, res, next) => {
  try {
    const me = await requireAuth(req);
    if (!me) return res.status(401).json({ error: "Not authenticated" });

    const { latitude, longitude, notes } = req.body;
    const today = new Date().toISOString().split("T")[0];

    const existing = await db.select().from(attendanceTable)
      .where(and(eq(attendanceTable.employeeId, me.id), eq(attendanceTable.date, today)))
      .limit(1);

    if (existing.length && existing[0].punchIn) {
      return res.status(400).json({ error: "Already punched in today" });
    }

    const isWithin = await checkGeofence(latitude, longitude);
    const now = new Date();
    const shiftStart = new Date(now);
    shiftStart.setHours(9, 0, 0, 0);
    const isLate = now > shiftStart;

    const location = { latitude, longitude };
    
    let record;
    if (existing.length) {
      [record] = await db.update(attendanceTable)
        .set({ punchIn: now, status: isLate ? "late" : "present", punchInLocation: location, isWithinGeofence: isWithin, notes: notes || null })
        .where(eq(attendanceTable.id, existing[0].id))
        .returning();
    } else {
      [record] = await db.insert(attendanceTable).values({
        employeeId: me.id,
        date: today,
        punchIn: now,
        status: isLate ? "late" : "present",
        punchInLocation: location,
        isWithinGeofence: isWithin,
        notes: notes || null,
      }).returning();
    }

    const [enriched] = await enrichAttendance([record]);
    return res.json(enriched);
  } catch (err) {
    next(err);
  }
});

router.post("/attendance/punch-out", async (req, res, next) => {
  try {
    const me = await requireAuth(req);
    if (!me) return res.status(401).json({ error: "Not authenticated" });

    const { latitude, longitude, notes } = req.body;
    const today = new Date().toISOString().split("T")[0];

    const existing = await db.select().from(attendanceTable)
      .where(and(eq(attendanceTable.employeeId, me.id), eq(attendanceTable.date, today)))
      .limit(1);

    if (!existing.length || !existing[0].punchIn) {
      return res.status(400).json({ error: "Not punched in today" });
    }

    if (existing[0].punchOut) {
      return res.status(400).json({ error: "Already punched out today" });
    }

    const now = new Date();
    const punchIn = existing[0].punchIn!;
    const workingMs = now.getTime() - punchIn.getTime();
    const workingHours = workingMs / (1000 * 60 * 60);
    const overtimeHours = Math.max(0, workingHours - 9);
    const location = { latitude, longitude };

    const [record] = await db.update(attendanceTable)
      .set({
        punchOut: now,
        workingHours: String(workingHours.toFixed(2)),
        overtime: String(overtimeHours.toFixed(2)),
        punchOutLocation: location,
        notes: notes || existing[0].notes,
      })
      .where(eq(attendanceTable.id, existing[0].id))
      .returning();

    const [enriched] = await enrichAttendance([record]);
    return res.json(enriched);
  } catch (err) {
    next(err);
  }
});

router.get("/attendance/today", async (req, res, next) => {
  try {
    const me = await requireAuth(req);
    if (!me) return res.status(401).json({ error: "Not authenticated" });

    const today = new Date().toISOString().split("T")[0];
    const records = await db.select().from(attendanceTable)
      .where(and(eq(attendanceTable.employeeId, me.id), eq(attendanceTable.date, today)))
      .limit(1);

    if (!records.length) {
      return res.json({ id: 0, employeeId: me.id, date: today, status: "absent", workingHours: null, overtime: 0 });
    }

    const [enriched] = await enrichAttendance(records);
    return res.json(enriched);
  } catch (err) {
    next(err);
  }
});

router.get("/attendance/my", async (req, res, next) => {
  try {
    const me = await requireAuth(req);
    if (!me) return res.status(401).json({ error: "Not authenticated" });

    const { startDate, endDate } = req.query;
    const end = endDate ? String(endDate) : new Date().toISOString().split("T")[0];
    const start = startDate ? String(startDate) : (() => {
      const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().split("T")[0];
    })();

    const records = await db.select().from(attendanceTable)
      .where(and(
        eq(attendanceTable.employeeId, me.id),
        gte(attendanceTable.date, start),
        lte(attendanceTable.date, end)
      ))
      .orderBy(desc(attendanceTable.date));

    return res.json(await enrichAttendance(records));
  } catch (err) {
    next(err);
  }
});

router.get("/attendance/all", async (req, res, next) => {
  try {
    const me = await requireAuth(req);
    if (!me || me.role !== "admin") return res.status(403).json({ error: "Forbidden" });

    const { date } = req.query;
    const targetDate = date ? String(date) : new Date().toISOString().split("T")[0];

    const records = await db.select().from(attendanceTable)
      .where(eq(attendanceTable.date, targetDate))
      .orderBy(desc(attendanceTable.createdAt));

    return res.json(await enrichAttendance(records));
  } catch (err) {
    next(err);
  }
});

router.get("/attendance/live", async (req, res, next) => {
  try {
    const me = await requireAuth(req);
    if (!me || me.role !== "admin") return res.status(403).json({ error: "Forbidden" });

    const today = new Date().toISOString().split("T")[0];
    const [allEmployees, todayRecords] = await Promise.all([
      db.select().from(employeesTable).where(eq(employeesTable.status, "active")),
      db.select().from(attendanceTable).where(eq(attendanceTable.date, today)),
    ]);

    const recordMap = Object.fromEntries(todayRecords.map(r => [r.employeeId, r]));
    const enriched = await enrichAttendance(todayRecords);

    const present = enriched.filter(r => r.status === "present" || r.status === "late").length;
    const absent = allEmployees.length - todayRecords.length + todayRecords.filter(r => r.status === "absent").length;
    const late = enriched.filter(r => r.status === "late").length;
    const onLeave = enriched.filter(r => r.status === "on_leave").length;

    return res.json({
      totalEmployees: allEmployees.length,
      presentCount: present,
      absentCount: absent,
      lateCount: late,
      onLeaveCount: onLeave,
      records: enriched,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/attendance/insights", async (req, res, next) => {
  try {
    const me = await requireAuth(req);
    if (!me || me.role !== "admin") return res.status(403).json({ error: "Forbidden" });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const start = thirtyDaysAgo.toISOString().split("T")[0];
    const today = new Date().toISOString().split("T")[0];

    const records = await db.select().from(attendanceTable)
      .where(and(gte(attendanceTable.date, start), lte(attendanceTable.date, today)));

    const employees = await db.select().from(employeesTable);
    const empMap = Object.fromEntries(employees.map(e => [e.id, `${e.firstName} ${e.lastName}`]));

    const lateCounts: Record<number, number> = {};
    const absentCounts: Record<number, number> = {};
    let totalHours = 0;
    let hourCount = 0;
    let overtimeCount = 0;

    for (const r of records) {
      if (r.status === "late") lateCounts[r.employeeId] = (lateCounts[r.employeeId] || 0) + 1;
      if (r.status === "absent") absentCounts[r.employeeId] = (absentCounts[r.employeeId] || 0) + 1;
      if (r.workingHours) { totalHours += Number(r.workingHours); hourCount++; }
      if (Number(r.overtime || 0) > 0) overtimeCount++;
    }

    const lateArrivals = Object.entries(lateCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([empId, count]) => ({
        employeeId: Number(empId),
        employeeName: empMap[Number(empId)] || "Unknown",
        lateCount: count,
        trend: count > 5 ? "worsening" : count > 2 ? "stable" : "improving",
      }));

    const absenteeismRisk = Object.entries(absentCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([empId, count]) => ({
        employeeId: Number(empId),
        employeeName: empMap[Number(empId)] || "Unknown",
        riskScore: Math.min(100, (count / 30) * 100),
        reason: count > 10 ? "High absenteeism rate" : count > 5 ? "Moderate absence pattern" : "Occasional absences",
      }));

    const anomalies = [];
    for (const [empId, count] of Object.entries(lateCounts)) {
      if (count >= 5) {
        anomalies.push({
          type: "frequent_late",
          message: `Frequent late arrivals detected (${count} times in 30 days)`,
          employeeId: Number(empId),
          employeeName: empMap[Number(empId)] || "Unknown",
        });
      }
    }
    for (const [empId, count] of Object.entries(absentCounts)) {
      if (count >= 8) {
        anomalies.push({
          type: "high_absence",
          message: `High absenteeism detected (${count} days in 30 days)`,
          employeeId: Number(empId),
          employeeName: empMap[Number(empId)] || "Unknown",
        });
      }
    }

    return res.json({
      lateArrivals,
      absenteeismRisk,
      averageWorkingHours: hourCount > 0 ? totalHours / hourCount : 0,
      overtimeEmployees: overtimeCount,
      anomalies,
    });
  } catch (err) {
    next(err);
  }
});

router.put("/attendance/:id", async (req, res, next) => {
  try {
    const me = await requireAuth(req);
    if (!me || me.role !== "admin") return res.status(403).json({ error: "Forbidden" });

    const id = Number(req.params.id);
    const { status, punchIn, punchOut, notes } = req.body;

    const updates: Record<string, unknown> = {};
    if (status) updates.status = status;
    if (punchIn) updates.punchIn = new Date(punchIn);
    if (punchOut) updates.punchOut = new Date(punchOut);
    if (notes !== undefined) updates.notes = notes;

    if (punchIn && punchOut) {
      const hours = (new Date(punchOut).getTime() - new Date(punchIn).getTime()) / (1000 * 60 * 60);
      updates.workingHours = String(hours.toFixed(2));
      updates.overtime = String(Math.max(0, hours - 9).toFixed(2));
    }

    const [record] = await db.update(attendanceTable).set(updates).where(eq(attendanceTable.id, id)).returning();
    if (!record) return res.status(404).json({ error: "Record not found" });

    const [enriched] = await enrichAttendance([record]);
    return res.json(enriched);
  } catch (err) {
    next(err);
  }
});

export default router;
