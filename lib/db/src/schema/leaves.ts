import { pgTable, serial, integer, text, timestamp, date, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const leavesTable = pgTable("leaves", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull(),
  type: text("type").notNull(), // casual, paid, sick, rh, maternity, paternity, unpaid
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  days: numeric("days", { precision: 5, scale: 1 }).notNull(),
  reason: text("reason").notNull(),
  status: text("status").notNull().default("pending"), // pending, approved, rejected, cancelled
  approvedBy: integer("approved_by"),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertLeaveSchema = createInsertSchema(leavesTable).omit({ id: true, createdAt: true });
export type InsertLeave = z.infer<typeof insertLeaveSchema>;
export type Leave = typeof leavesTable.$inferSelect;

export const leaveBalancesTable = pgTable("leave_balances", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull(),
  year: integer("year").notNull(),
  casualTotal: numeric("casual_total", { precision: 5, scale: 1 }).notNull().default("12"),
  casualUsed: numeric("casual_used", { precision: 5, scale: 1 }).notNull().default("0"),
  paidTotal: numeric("paid_total", { precision: 5, scale: 1 }).notNull().default("15"),
  paidUsed: numeric("paid_used", { precision: 5, scale: 1 }).notNull().default("0"),
  sickTotal: numeric("sick_total", { precision: 5, scale: 1 }).notNull().default("10"),
  sickUsed: numeric("sick_used", { precision: 5, scale: 1 }).notNull().default("0"),
  rhTotal: numeric("rh_total", { precision: 5, scale: 1 }).notNull().default("3"),
  rhUsed: numeric("rh_used", { precision: 5, scale: 1 }).notNull().default("0"),
  maternityTotal: numeric("maternity_total", { precision: 5, scale: 1 }).notNull().default("0"),
  maternityUsed: numeric("maternity_used", { precision: 5, scale: 1 }).notNull().default("0"),
  paternityTotal: numeric("paternity_total", { precision: 5, scale: 1 }).notNull().default("0"),
  paternityUsed: numeric("paternity_used", { precision: 5, scale: 1 }).notNull().default("0"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertLeaveBalanceSchema = createInsertSchema(leaveBalancesTable).omit({ id: true, createdAt: true });
export type InsertLeaveBalance = z.infer<typeof insertLeaveBalanceSchema>;
export type LeaveBalance = typeof leaveBalancesTable.$inferSelect;
