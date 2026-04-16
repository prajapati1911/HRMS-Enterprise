import { Router } from "express";
import { db, departmentsTable, employeesTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

router.get("/departments", async (req, res, next) => {
  try {
    const departments = await db.select().from(departmentsTable);
    const employees = await db.select().from(employeesTable);
    const empMap = Object.fromEntries(employees.map(e => [e.id, `${e.firstName} ${e.lastName}`]));
    
    const countMap: Record<number, number> = {};
    for (const e of employees) {
      if (e.departmentId) countMap[e.departmentId] = (countMap[e.departmentId] || 0) + 1;
    }

    return res.json(departments.map(d => ({
      ...d,
      managerName: d.managerId ? empMap[d.managerId] : null,
      employeeCount: countMap[d.id] || 0,
    })));
  } catch (err) {
    next(err);
  }
});

router.post("/departments", async (req, res, next) => {
  try {
    const me = await requireAuth(req);
    if (!me || me.role !== "admin") return res.status(403).json({ error: "Forbidden" });

    const { name, code, managerId } = req.body;
    const [dept] = await db.insert(departmentsTable).values({ name, code: code || null, managerId: managerId || null }).returning();
    return res.status(201).json({ ...dept, managerName: null, employeeCount: 0 });
  } catch (err) {
    next(err);
  }
});

router.put("/departments/:id", async (req, res, next) => {
  try {
    const me = await requireAuth(req);
    if (!me || me.role !== "admin") return res.status(403).json({ error: "Forbidden" });

    const id = Number(req.params.id);
    const { name, code, managerId } = req.body;
    const [dept] = await db.update(departmentsTable).set({ name, code, managerId }).where(eq(departmentsTable.id, id)).returning();
    if (!dept) return res.status(404).json({ error: "Department not found" });

    const employees = await db.select().from(employeesTable);
    const empMap = Object.fromEntries(employees.map(e => [e.id, `${e.firstName} ${e.lastName}`]));
    const countMap: Record<number, number> = {};
    for (const e of employees) {
      if (e.departmentId) countMap[e.departmentId] = (countMap[e.departmentId] || 0) + 1;
    }

    return res.json({ ...dept, managerName: dept.managerId ? empMap[dept.managerId] : null, employeeCount: countMap[dept.id] || 0 });
  } catch (err) {
    next(err);
  }
});

router.delete("/departments/:id", async (req, res, next) => {
  try {
    const me = await requireAuth(req);
    if (!me || me.role !== "admin") return res.status(403).json({ error: "Forbidden" });

    await db.delete(departmentsTable).where(eq(departmentsTable.id, Number(req.params.id)));
    return res.json({ message: "Department deleted" });
  } catch (err) {
    next(err);
  }
});

export default router;
