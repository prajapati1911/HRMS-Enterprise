import { pgTable, serial, text, numeric, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const geofencesTable = pgTable("geofences", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  latitude: numeric("latitude", { precision: 10, scale: 7 }).notNull(),
  longitude: numeric("longitude", { precision: 10, scale: 7 }).notNull(),
  radius: numeric("radius", { precision: 8, scale: 2 }).notNull(), // meters
  address: text("address"),
  branchId: integer("branch_id"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertGeofenceSchema = createInsertSchema(geofencesTable).omit({ id: true, createdAt: true });
export type InsertGeofence = z.infer<typeof insertGeofenceSchema>;
export type Geofence = typeof geofencesTable.$inferSelect;
