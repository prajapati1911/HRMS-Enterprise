import { pgTable, serial, integer, text, timestamp, date, numeric, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const attendanceTable = pgTable("attendance", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull(),
  date: date("date").notNull(),
  punchIn: timestamp("punch_in", { withTimezone: true }),
  punchOut: timestamp("punch_out", { withTimezone: true }),
  status: text("status").notNull().default("absent"), // present, absent, late, half_day, on_leave, holiday
  workingHours: numeric("working_hours", { precision: 5, scale: 2 }),
  overtime: numeric("overtime", { precision: 5, scale: 2 }).default("0"),
  punchInLocation: jsonb("punch_in_location"),
  punchOutLocation: jsonb("punch_out_location"),
  isWithinGeofence: boolean("is_within_geofence").default(true),
  selfieUrl: text("selfie_url"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertAttendanceSchema = createInsertSchema(attendanceTable).omit({ id: true, createdAt: true });
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type Attendance = typeof attendanceTable.$inferSelect;
