import { db, sessionsTable, employeesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { Request } from "express";
import crypto from "crypto";

export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "hrms_salt_2024").digest("hex");
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export async function createSession(employeeId: number): Promise<string> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  await db.insert(sessionsTable).values({ employeeId, token, expiresAt });
  return token;
}

export async function getEmployeeFromToken(token: string | undefined) {
  if (!token) return null;
  const sessions = await db
    .select()
    .from(sessionsTable)
    .where(eq(sessionsTable.token, token))
    .limit(1);
  
  if (!sessions.length || sessions[0].expiresAt < new Date()) return null;
  
  const employees = await db
    .select()
    .from(employeesTable)
    .where(eq(employeesTable.id, sessions[0].employeeId))
    .limit(1);
  
  return employees[0] || null;
}

export async function requireAuth(req: Request): Promise<typeof employeesTable.$inferSelect | null> {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;
  // Also check cookie
  const cookieToken = (req as any).cookies?.hrms_token;
  return getEmployeeFromToken(token || cookieToken);
}
