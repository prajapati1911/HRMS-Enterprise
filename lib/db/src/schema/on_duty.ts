import { pgTable, serial, integer, text, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const onDutyTable = pgTable("on_duty", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull(),
  date: date("date").notNull(),
  reason: text("reason").notNull(),
  fromTime: text("from_time").notNull(),
  toTime: text("to_time").notNull(),
  location: text("location"),
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  approvedBy: integer("approved_by"),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertOnDutySchema = createInsertSchema(onDutyTable).omit({ id: true, createdAt: true });
export type InsertOnDuty = z.infer<typeof insertOnDutySchema>;
export type OnDuty = typeof onDutyTable.$inferSelect;
