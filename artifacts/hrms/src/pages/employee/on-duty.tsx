import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { MapPin, Plus, Clock, CheckCircle, XCircle, CalendarDays } from "lucide-react";
const BASE = "/api";
function token() { return localStorage.getItem("hrms_token") || ""; }

async function fetchMyOnDuty() {
  const r = await fetch(`${BASE}/on-duty/my`, { headers: { Authorization: `Bearer ${token()}` } });
  if (!r.ok) throw new Error("Failed");
  return r.json();
}

async function applyOnDuty(data: any) {
  const r = await fetch(`${BASE}/on-duty`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
    body: JSON.stringify(data),
  });
  if (!r.ok) throw new Error("Failed");
  return r.json();
}

const statusColor = (s: string) => {
  if (s === "approved") return "bg-green-500/10 text-green-600 border-green-500/20";
  if (s === "rejected") return "bg-destructive/10 text-destructive border-destructive/20";
  return "bg-amber-500/10 text-amber-600 border-amber-500/20";
};

export default function EmployeeOnDuty() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ date: "", reason: "", fromTime: "", toTime: "", location: "" });

  const { data: items, isLoading } = useQuery({ queryKey: ["my-on-duty"], queryFn: fetchMyOnDuty });
  const mutation = useMutation({
    mutationFn: applyOnDuty,
    onSuccess: () => {
      toast({ title: "On-duty request submitted!" });
      queryClient.invalidateQueries({ queryKey: ["my-on-duty"] });
      setOpen(false);
      setForm({ date: "", reason: "", fromTime: "", toTime: "", location: "" });
    },
    onError: () => toast({ title: "Failed to submit", variant: "destructive" }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.date || !form.reason || !form.fromTime || !form.toTime) return;
    mutation.mutate(form);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">On-Duty Requests</h2>
          <p className="text-muted-foreground">Were you on field duty but couldn't mark attendance? Apply here.</p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2 rounded-xl">
          <Plus className="h-4 w-4" /> Apply for On-Duty
        </Button>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          [1, 2].map(i => <Card key={i} className="glass-panel"><CardContent className="p-5"><Skeleton className="h-16 w-full" /></CardContent></Card>)
        ) : (items || []).map((item: any) => (
          <Card key={item.id} className="glass-panel hover:bg-muted/10 transition-colors">
            <CardContent className="p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <CalendarDays className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">{new Date(item.date).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{item.reason}</p>
                    <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{item.fromTime} – {item.toTime}</span>
                      {item.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{item.location}</span>}
                    </div>
                  </div>
                </div>
                <div className="self-end sm:self-center">
                  <Badge variant="outline" className={statusColor(item.status)}>
                    {item.status === "approved" && <CheckCircle className="mr-1 h-3 w-3" />}
                    {item.status === "rejected" && <XCircle className="mr-1 h-3 w-3" />}
                    {item.status}
                  </Badge>
                </div>
              </div>
              {item.rejectionReason && (
                <p className="text-xs text-destructive mt-3 bg-destructive/5 rounded-lg px-3 py-2">
                  Reason: {item.rejectionReason}
                </p>
              )}
              {item.status === "approved" && (
                <p className="text-xs text-green-600 mt-2 bg-green-500/5 rounded-lg px-3 py-2">
                  Attendance has been marked as Present for this date.
                </p>
              )}
            </CardContent>
          </Card>
        ))}
        {!isLoading && (!items || items.length === 0) && (
          <div className="text-center py-16 glass-panel rounded-xl">
            <MapPin className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">No on-duty requests yet.</p>
            <p className="text-xs text-muted-foreground mt-1">Apply if you were on duty but couldn't mark attendance.</p>
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Apply for On-Duty</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Date *</Label>
              <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>From Time *</Label>
                <Input type="time" value={form.fromTime} onChange={e => setForm(f => ({ ...f, fromTime: e.target.value }))} required />
              </div>
              <div className="space-y-1.5">
                <Label>To Time *</Label>
                <Input type="time" value={form.toTime} onChange={e => setForm(f => ({ ...f, toTime: e.target.value }))} required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Location / Place Visited</Label>
              <Input placeholder="e.g. Client Office, Mumbai" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Reason / Purpose *</Label>
              <Textarea placeholder="Explain the purpose of on-duty..." value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} rows={3} required />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Submitting..." : "Submit Request"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
