import { Router } from "express";
import { db, employeesTable, sessionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { hashPassword, verifyPassword, createSession, requireAuth } from "../lib/auth";

const router = Router();

router.post("/auth/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const employees = await db
      .select()
      .from(employeesTable)
      .where(eq(employeesTable.email, email.toLowerCase()))
      .limit(1);

    if (!employees.length) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const employee = employees[0];
    if (!verifyPassword(password, employee.passwordHash)) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = await createSession(employee.id);

    const { passwordHash: _, ...safeEmployee } = employee;
    
    return res.json({
      employee: safeEmployee,
      token,
    });
  } catch (err) {
    next(err);
  }
});

router.post("/auth/logout", async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;
    if (token) {
      await db.delete(sessionsTable).where(eq(sessionsTable.token, token));
    }
    return res.json({ message: "Logged out" });
  } catch (err) {
    next(err);
  }
});

router.get("/auth/me", async (req, res, next) => {
  try {
    const employee = await requireAuth(req);
    if (!employee) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const { passwordHash: _, ...safeEmployee } = employee;
    return res.json(safeEmployee);
  } catch (err) {
    next(err);
  }
});

export default router;
