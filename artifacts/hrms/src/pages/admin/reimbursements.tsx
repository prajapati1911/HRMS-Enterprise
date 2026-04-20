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
import { Receipt, CheckCircle, XCircle, IndianRupee, Clock } from "lucide-react";
const BASE = "/api";
function token() { return localStorage.getItem("hrms_token") || ""; }
function fmt(n: number) { return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(n); }

async function fetchReimbursements() {
  const r = await fetch(`${BASE}/reimbursements`, { headers: { Authorization: `Bearer ${token()}` } });
  if (!r.ok) throw new Error("Failed");
  return r.json();
}

async function updateStatus(id: number, status: string, rejectionReason?: string) {
  const r = await fetch(`${BASE}/reimbursements/${id}`, {
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

export default function AdminReimbursements() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [rejectDialog, setRejectDialog] = useState<{ id: number; title: string } | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const { data: items, isLoading } = useQuery({ queryKey: ["admin-reimbursements"], queryFn: fetchReimbursements });

  const mutation = useMutation({
    mutationFn: ({ id, status, reason }: { id: number; status: string; reason?: string }) => updateStatus(id, status, reason),
    onSuccess: () => {
      toast({ title: "Status updated" });
      queryClient.invalidateQueries({ queryKey: ["admin-reimbursements"] });
      setRejectDialog(null);
      setRejectionReason("");
    },
    onError: () => toast({ title: "Failed", variant: "destructive" }),
  });

  const totalPending = (items || []).filter((i: any) => i.status === "pending").reduce((s: number, i: any) => s + i.amount, 0);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Reimbursement Requests</h2>
        <p className="text-muted-foreground">Review and approve employee expense reimbursements.</p>
      </div>

      {items && items.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="glass-panel">
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground">Pending Amount</p>
              <p className="text-xl font-bold text-amber-600 flex items-center gap-1"><IndianRupee className="h-4 w-4" />{fmt(totalPending)}</p>
            </CardContent>
          </Card>
          <Card className="glass-panel">
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground">Pending</p>
              <p className="text-xl font-bold text-amber-600">{(items || []).filter((i: any) => i.status === "pending").length}</p>
            </CardContent>
          </Card>
          <Card className="glass-panel">
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground">Approved</p>
              <p className="text-xl font-bold text-green-600">{(items || []).filter((i: any) => i.status === "approved").length}</p>
            </CardContent>
          </Card>
          <Card className="glass-panel">
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground">Total Requests</p>
              <p className="text-xl font-bold">{(items || []).length}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="glass-panel">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground bg-muted/40 uppercase border-b border-border">
              <tr>
                <th className="px-5 py-4 font-medium">Employee</th>
                <th className="px-5 py-4 font-medium">Title</th>
                <th className="px-5 py-4 font-medium">Amount (₹)</th>
                <th className="px-5 py-4 font-medium">Description</th>
                <th className="px-5 py-4 font-medium">Date</th>
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
                  <td className="px-5 py-4">{item.title}</td>
                  <td className="px-5 py-4 font-bold text-primary">₹{fmt(item.amount)}</td>
                  <td className="px-5 py-4 text-muted-foreground max-w-xs truncate">{item.description || "—"}</td>
                  <td className="px-5 py-4 text-muted-foreground">{new Date(item.createdAt).toLocaleDateString("en-IN")}</td>
                  <td className="px-5 py-4">
                    <Badge variant="outline" className={statusColor(item.status)}>
                      {item.status === "pending" && <Clock className="mr-1 h-3 w-3" />}
                      {item.status === "approved" && <CheckCircle className="mr-1 h-3 w-3" />}
                      {item.status === "rejected" && <XCircle className="mr-1 h-3 w-3" />}
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
                          disabled={mutation.isPending} onClick={() => setRejectDialog({ id: item.id, title: item.title })}>
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
              <Receipt className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">No reimbursement requests yet.</p>
            </div>
          )}
        </div>
      </Card>

      <Dialog open={!!rejectDialog} onOpenChange={() => setRejectDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Reject Reimbursement</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">Rejecting: <span className="font-medium text-foreground">{rejectDialog?.title}</span></p>
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
