import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { MapPin, CheckCircle, XCircle, Clock, CalendarDays } from "lucide-react";
const BASE = "/api";
function token() { return localStorage.getItem("hrms_token") || ""; }

async function fetchOnDuty() {
  const r = await fetch(`${BASE}/on-duty`, { headers: { Authorization: `Bearer ${token()}` } });
  if (!r.ok) throw new Error("Failed");
  return r.json();
}

async function updateStatus(id: number, status: string, rejectionReason?: string) {
  const r = await fetch(`${BASE}/on-duty/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
    body: JSON.stringify({ status, rejectionReason }),
  });
  if (!r.ok) throw new Error("Failed");
  return r.json();
}

const statusColor = (s: string) => {
  if (s === "approved") return "bg-green-500/10 text-green-600 border-green-500/20";
  if (s === "rejected") return "bg-destructive/10 text-destructive border-destructive/20";
  return "bg-amber-500/10 text-amber-600 border-amber-500/20";
};

export default function AdminOnDuty() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [rejectDialog, setRejectDialog] = useState<{ id: number } | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const { data: items, isLoading } = useQuery({ queryKey: ["admin-on-duty"], queryFn: fetchOnDuty });
  const mutation = useMutation({
    mutationFn: ({ id, status, reason }: { id: number; status: string; reason?: string }) => updateStatus(id, status, reason),
    onSuccess: (_, vars) => {
      toast({ title: vars.status === "approved" ? "On-duty approved! Attendance marked as Present." : "Request rejected." });
      queryClient.invalidateQueries({ queryKey: ["admin-on-duty"] });
      setRejectDialog(null);
      setRejectionReason("");
    },
    onError: () => toast({ title: "Failed", variant: "destructive" }),
  });

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">On-Duty Requests</h2>
          <p className="text-muted-foreground">Approve on-duty requests to auto-mark attendance as Present.</p>
        </div>
        <div className="flex gap-3 text-sm">
          <div className="flex items-center gap-1.5 bg-amber-500/10 text-amber-600 px-3 py-1.5 rounded-full">
            <Clock className="h-3.5 w-3.5" />
            {(items || []).filter((i: any) => i.status === "pending").length} Pending
          </div>
        </div>
      </div>

      <Card className="glass-panel">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground bg-muted/40 uppercase border-b border-border">
              <tr>
                <th className="px-5 py-4 font-medium">Employee</th>
                <th className="px-5 py-4 font-medium">Date</th>
                <th className="px-5 py-4 font-medium">Time</th>
                <th className="px-5 py-4 font-medium">Location</th>
                <th className="px-5 py-4 font-medium">Reason</th>
                <th className="px-5 py-4 font-medium">Status</th>
                <th className="px-5 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                [1, 2, 3].map(i => (
                  <tr key={i}>{[...Array(7)].map((_, j) => <td key={j} className="px-5 py-4"><Skeleton className="h-5 w-20" /></td>)}</tr>
                ))
              ) : (items || []).map((item: any) => (
                <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-4 font-medium">{item.employeeName}</td>
                  <td className="px-5 py-4">
                    <span className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                      {new Date(item.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">{item.fromTime} – {item.toTime}</td>
                  <td className="px-5 py-4 text-muted-foreground">
                    {item.location ? <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{item.location}</span> : "—"}
                  </td>
                  <td className="px-5 py-4 max-w-xs">
                    <p className="truncate text-muted-foreground">{item.reason}</p>
                  </td>
                  <td className="px-5 py-4">
                    <Badge variant="outline" className={statusColor(item.status)}>
                      {item.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-4 text-right">
                    {item.status === "pending" && (
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="outline" className="h-7 text-xs text-green-600 border-green-500/30 hover:bg-green-500/10 gap-1"
                          disabled={mutation.isPending} onClick={() => mutation.mutate({ id: item.id, status: "approved" })}>
                          <CheckCircle className="h-3 w-3" /> Approve
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs text-destructive border-destructive/30 hover:bg-destructive/10 gap-1"
                          disabled={mutation.isPending} onClick={() => setRejectDialog({ id: item.id })}>
                          <XCircle className="h-3 w-3" /> Reject
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!isLoading && (!items || items.length === 0) && (
            <div className="text-center py-16">
              <MapPin className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">No on-duty requests yet.</p>
            </div>
          )}
        </div>
      </Card>

      <Dialog open={!!rejectDialog} onOpenChange={() => setRejectDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Reject On-Duty Request</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Reason for Rejection</Label>
              <Input placeholder="Explain why..." value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog(null)}>Cancel</Button>
            <Button variant="destructive" disabled={mutation.isPending}
              onClick={() => rejectDialog && mutation.mutate({ id: rejectDialog.id, status: "rejected", reason: rejectionReason })}>
              {mutation.isPending ? "Rejecting..." : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
