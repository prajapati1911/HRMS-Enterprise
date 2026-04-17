import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Plus, Trash2 } from "lucide-react";
import {
  useListGeofences,
  useCreateGeofence,
  useDeleteGeofence,
  getListGeofencesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const EMPTY = { name: "", latitude: "", longitude: "", radius: "", address: "" };

export default function AdminGeofence() {
  const { data: geofences, isLoading } = useListGeofences();
  const createGeofence = useCreateGeofence();
  const deleteGeofence = useDeleteGeofence();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });
  const [submitting, setSubmitting] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);

  const handleOpen = () => {
    setForm({ ...EMPTY });
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.latitude || !form.longitude || !form.radius) return;
    setSubmitting(true);
    try {
      await createGeofence.mutateAsync({
        data: {
          name: form.name,
          latitude: Number(form.latitude),
          longitude: Number(form.longitude),
          radius: Number(form.radius),
          address: form.address || undefined,
        },
      });
      toast({ title: "Location added successfully" });
      queryClient.invalidateQueries({ queryKey: getListGeofencesQueryKey() });
      setOpen(false);
    } catch {
      toast({ title: "Failed to add location", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this location?")) return;
    try {
      await deleteGeofence.mutateAsync({ id });
      toast({ title: "Location deleted" });
      if (selected === id) setSelected(null);
      queryClient.invalidateQueries({ queryKey: getListGeofencesQueryKey() });
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  };

  const activeGeofence = geofences?.find((g) => g.id === selected) ?? geofences?.[0];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Geo-fencing</h2>
          <p className="text-muted-foreground">Configure allowed locations for attendance punch-in.</p>
        </div>
        <Button onClick={handleOpen} className="rounded-xl shadow-lg">
          <Plus className="mr-2 h-4 w-4" /> Add Location
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-3">
          {isLoading ? (
            [1, 2].map((i) => (
              <Card key={i} className="glass-panel">
                <CardContent className="p-4"><Skeleton className="h-12 w-full" /></CardContent>
              </Card>
            ))
          ) : geofences?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No locations configured yet.
            </div>
          ) : (
            geofences?.map((g) => {
              const isActive = (selected === null ? g.id === geofences[0]?.id : g.id === selected);
              return (
                <Card
                  key={g.id}
                  onClick={() => setSelected(g.id)}
                  className={`glass-panel cursor-pointer transition-colors ${isActive ? "border-primary/40 bg-primary/5" : "hover:bg-muted/10"}`}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold truncate">{g.name}</h4>
                      <p className="text-xs text-muted-foreground">Radius: {g.radius}m</p>
                      {g.address && <p className="text-xs text-muted-foreground truncate">{g.address}</p>}
                    </div>
                    <div className="flex items-center gap-1 ml-2 shrink-0">
                      <MapPin className={`h-5 w-5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive/60 hover:text-destructive hover:bg-destructive/10"
                        onClick={(e) => { e.stopPropagation(); handleDelete(g.id); }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        <div className="md:col-span-2">
          <Card className="glass-panel h-[500px] flex items-center justify-center bg-muted/20 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-cover bg-center mix-blend-luminosity" style={{ backgroundImage: "url('https://maps.wikimedia.org/maps/osm/12/655/1583.png')" }} />
            <div className="relative z-10 flex flex-col items-center gap-4">
              <div className="h-48 w-48 rounded-full border-2 border-primary bg-primary/10 flex items-center justify-center">
                <MapPin className="text-primary h-8 w-8 -mt-4" />
              </div>
              {activeGeofence ? (
                <div className="text-center bg-background/80 px-4 py-2 rounded-xl backdrop-blur-sm">
                  <p className="font-semibold text-primary">{activeGeofence.name}</p>
                  <p className="text-xs text-muted-foreground">Radius: {activeGeofence.radius}m</p>
                  {activeGeofence.address && (
                    <p className="text-xs text-muted-foreground mt-0.5">{activeGeofence.address}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1 font-mono">
                    {activeGeofence.latitude.toFixed(4)}, {activeGeofence.longitude.toFixed(4)}
                  </p>
                </div>
              ) : (
                <p className="text-sm font-medium text-primary bg-background/80 px-3 py-1 rounded-full backdrop-blur-sm">
                  No location selected
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Location</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Location Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. HQ Office"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Latitude *</Label>
                <Input
                  type="number"
                  step="any"
                  value={form.latitude}
                  onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                  placeholder="e.g. 28.6139"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Longitude *</Label>
                <Input
                  type="number"
                  step="any"
                  value={form.longitude}
                  onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                  placeholder="e.g. 77.2090"
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Radius (meters) *</Label>
              <Input
                type="number"
                min="10"
                value={form.radius}
                onChange={(e) => setForm({ ...form, radius: e.target.value })}
                placeholder="e.g. 100"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Address</Label>
              <Input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="e.g. 123 Main St, City"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Adding..." : "Add Location"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
