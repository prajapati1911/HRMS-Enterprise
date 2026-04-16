import { pgTable, serial, text, integer, numeric, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const employeesTable = pgTable("employees", {
  id: serial("id").primaryKey(),
  employeeCode: text("employee_code").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("employee"), // admin, employee, manager
  status: text("status").notNull().default("active"), // active, inactive, on_leave
  departmentId: integer("department_id"),
  designation: text("designation"),
  shift: text("shift").default("9:00 AM - 6:00 PM"),
  joiningDate: date("joining_date"),
  salary: numeric("salary", { precision: 12, scale: 2 }),
  avatarUrl: text("avatar_url"),
  branchId: integer("branch_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertEmployeeSchema = createInsertSchema(employeesTable).omit({ id: true, createdAt: true });
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type Employee = typeof employeesTable.$inferSelect;
