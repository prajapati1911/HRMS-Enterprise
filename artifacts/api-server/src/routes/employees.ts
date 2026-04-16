import { Router } from "express";
import { db, employeesTable, departmentsTable, branchesTable } from "@workspace/db";
import { eq, ilike, and, sql } from "drizzle-orm";
import { requireAuth, hashPassword } from "../lib/auth";

const router = Router();

function buildEmployeeResponse(emp: typeof employeesTable.$inferSelect, deptName?: string, branchName?: string) {
  const { passwordHash: _, ...safe } = emp;
  return {
    ...safe,
    departmentName: deptName || null,
    branchName: branchName || null,
  };
}

router.get("/employees", async (req, res, next) => {
  try {
    const { departmentId, status, search } = req.query;
    
    const conditions = [];
    if (departmentId) conditions.push(eq(employeesTable.departmentId, Number(departmentId)));
    if (status) conditions.push(eq(employeesTable.status, String(status)));
    if (search) conditions.push(
      sql`(${ilike(employeesTable.firstName, `%${search}%`)} OR ${ilike(employeesTable.lastName, `%${search}%`)} OR ${ilike(employeesTable.email, `%${search}%`)} OR ${ilike(employeesTable.employeeCode, `%${search}%`)})`
    );

    const employees = conditions.length
      ? await db.select().from(employeesTable).where(and(...conditions))
      : await db.select().from(employeesTable);

    const departments = await db.select().from(departmentsTable);
    const deptMap = Object.fromEntries(departments.map(d => [d.id, d.name]));

    return res.json(employees.map(e => buildEmployeeResponse(e, e.departmentId ? deptMap[e.departmentId] : undefined)));
  } catch (err) {
    next(err);
  }
});

router.post("/employees", async (req, res, next) => {
  try {
    const me = await requireAuth(req);
    if (!me || me.role !== "admin") return res.status(403).json({ error: "Forbidden" });

    const { firstName, lastName, email, phone, password, role, departmentId, designation, shift, joiningDate, salary, branchId } = req.body;
    
    if (!firstName || !lastName || !email || !password || !role) {
      return res.status(400).json({ error: "Required fields missing" });
    }

    const count = await db.select({ count: sql<number>`count(*)` }).from(employeesTable);
    const empCode = `EMP${String(Number(count[0].count) + 1).padStart(4, "0")}`;

    const [emp] = await db.insert(employeesTable).values({
      employeeCode: empCode,
      firstName,
      lastName,
      email: email.toLowerCase(),
      phone: phone || null,
      passwordHash: hashPassword(password),
      role,
      departmentId: departmentId || null,
      designation: designation || null,
      shift: shift || "9:00 AM - 6:00 PM",
      joiningDate: joiningDate || null,
      salary: salary ? String(salary) : null,
      branchId: branchId || null,
    }).returning();

    const departments = await db.select().from(departmentsTable);
    const deptMap = Object.fromEntries(departments.map(d => [d.id, d.name]));
    
    return res.status(201).json(buildEmployeeResponse(emp, emp.departmentId ? deptMap[emp.departmentId] : undefined));
  } catch (err) {
    next(err);
  }
});

router.get("/employees/summary", async (req, res, next) => {
  try {
    const employees = await db.select().from(employeesTable);
    const departments = await db.select().from(departmentsTable);
    const deptMap = Object.fromEntries(departments.map(d => [d.id, d.name]));

    const total = employees.length;
    const active = employees.filter(e => e.status === "active").length;
    const inactive = employees.filter(e => e.status === "inactive").length;
    const onLeave = employees.filter(e => e.status === "on_leave").length;

    const byDept: Record<string, number> = {};
    for (const e of employees) {
      const name = e.departmentId ? (deptMap[e.departmentId] || "Unknown") : "No Department";
      byDept[name] = (byDept[name] || 0) + 1;
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentJoins = employees.filter(e => e.joiningDate && new Date(e.joiningDate) >= thirtyDaysAgo).length;

    return res.json({
      total,
      active,
      inactive,
      onLeave,
      byDepartment: Object.entries(byDept).map(([departmentName, count]) => ({ departmentName, count })),
      recentJoins,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/employees/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const employees = await db.select().from(employeesTable).where(eq(employeesTable.id, id)).limit(1);
    if (!employees.length) return res.status(404).json({ error: "Employee not found" });

    const departments = await db.select().from(departmentsTable);
    const deptMap = Object.fromEntries(departments.map(d => [d.id, d.name]));

    return res.json(buildEmployeeResponse(employees[0], employees[0].departmentId ? deptMap[employees[0].departmentId] : undefined));
  } catch (err) {
    next(err);
  }
});

router.put("/employees/:id", async (req, res, next) => {
  try {
    const me = await requireAuth(req);
    if (!me || me.role !== "admin") return res.status(403).json({ error: "Forbidden" });

    const id = Number(req.params.id);
    const { firstName, lastName, phone, role, departmentId, designation, shift, salary, status, branchId } = req.body;

    const updates: Record<string, unknown> = {};
    if (firstName !== undefined) updates.firstName = firstName;
    if (lastName !== undefined) updates.lastName = lastName;
    if (phone !== undefined) updates.phone = phone;
    if (role !== undefined) updates.role = role;
    if (departmentId !== undefined) updates.departmentId = departmentId;
    if (designation !== undefined) updates.designation = designation;
    if (shift !== undefined) updates.shift = shift;
    if (salary !== undefined) updates.salary = String(salary);
    if (status !== undefined) updates.status = status;
    if (branchId !== undefined) updates.branchId = branchId;

    const [updated] = await db.update(employeesTable).set(updates).where(eq(employeesTable.id, id)).returning();
    if (!updated) return res.status(404).json({ error: "Employee not found" });

    const departments = await db.select().from(departmentsTable);
    const deptMap = Object.fromEntries(departments.map(d => [d.id, d.name]));

    return res.json(buildEmployeeResponse(updated, updated.departmentId ? deptMap[updated.departmentId] : undefined));
  } catch (err) {
    next(err);
  }
});

router.delete("/employees/:id", async (req, res, next) => {
  try {
    const me = await requireAuth(req);
    if (!me || me.role !== "admin") return res.status(403).json({ error: "Forbidden" });

    const id = Number(req.params.id);
    await db.delete(employeesTable).where(eq(employeesTable.id, id));
    return res.json({ message: "Employee deleted" });
  } catch (err) {
    next(err);
  }
});

export default router;
