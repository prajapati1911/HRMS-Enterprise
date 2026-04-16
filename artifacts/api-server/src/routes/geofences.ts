import { Router } from "express";
import { db, geofencesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

router.get("/geofence", async (req, res, next) => {
  try {
    const fences = await db.select().from(geofencesTable);
    return res.json(fences.map(f => ({ ...f, latitude: Number(f.latitude), longitude: Number(f.longitude), radius: Number(f.radius) })));
  } catch (err) {
    next(err);
  }
});

router.post("/geofence", async (req, res, next) => {
  try {
    const me = await requireAuth(req);
    if (!me || me.role !== "admin") return res.status(403).json({ error: "Forbidden" });

    const { name, latitude, longitude, radius, address, branchId } = req.body;
    const [fence] = await db.insert(geofencesTable).values({
      name, latitude: String(latitude), longitude: String(longitude), radius: String(radius),
      address: address || null, branchId: branchId || null,
    }).returning();
    return res.status(201).json({ ...fence, latitude: Number(fence.latitude), longitude: Number(fence.longitude), radius: Number(fence.radius) });
  } catch (err) {
    next(err);
  }
});

router.put("/geofence/:id", async (req, res, next) => {
  try {
    const me = await requireAuth(req);
    if (!me || me.role !== "admin") return res.status(403).json({ error: "Forbidden" });

    const id = Number(req.params.id);
    const { name, latitude, longitude, radius, address, isActive } = req.body;
    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (latitude !== undefined) updates.latitude = String(latitude);
    if (longitude !== undefined) updates.longitude = String(longitude);
    if (radius !== undefined) updates.radius = String(radius);
    if (address !== undefined) updates.address = address;
    if (isActive !== undefined) updates.isActive = isActive;

    const [fence] = await db.update(geofencesTable).set(updates).where(eq(geofencesTable.id, id)).returning();
    if (!fence) return res.status(404).json({ error: "Geofence not found" });
    return res.json({ ...fence, latitude: Number(fence.latitude), longitude: Number(fence.longitude), radius: Number(fence.radius) });
  } catch (err) {
    next(err);
  }
});

router.delete("/geofence/:id", async (req, res, next) => {
  try {
    const me = await requireAuth(req);
    if (!me || me.role !== "admin") return res.status(403).json({ error: "Forbidden" });

    await db.delete(geofencesTable).where(eq(geofencesTable.id, Number(req.params.id)));
    return res.json({ message: "Geofence deleted" });
  } catch (err) {
    next(err);
  }
});

export default router;
