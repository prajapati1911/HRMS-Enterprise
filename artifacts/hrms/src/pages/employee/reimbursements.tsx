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
import { Receipt, Plus, IndianRupee, CheckCircle, XCircle, Clock } from "lucide-react";
const BASE = "/api";

function token() { return localStorage.getItem("hrms_token") || ""; }

function fmt(n: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(n);
}

async function fetchMyReimbursements() {
  const r = await fetch(`${BASE}/reimbursements/my`, { headers: { Authorization: `Bearer ${token()}` } });
  if (!r.ok) throw new Error("Failed");
  return r.json();
}

async function applyReimbursement(data: any) {
  const r = await fetch(`${BASE}/reimbursements`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
    body: JSON.stringify(data),
  });
  if (!r.ok) throw new Error("Failed");
  return r.json();
}

const statusIcon = (s: string) => {
  if (s === "approved") return <CheckCircle className="h-4 w-4 text-green-600" />;
  if (s === "rejected") return <XCircle className="h-4 w-4 text-destructive" />;
  return <Clock className="h-4 w-4 text-amber-500" />;
};

const statusColor = (s: string) => {
  if (s === "approved") return "bg-green-500/10 text-green-600 border-green-500/20";
  if (s === "rejected") return "bg-destructive/10 text-destructive border-destructive/20";
  return "bg-amber-500/10 text-amber-600 border-amber-500/20";
};

export default function EmployeeReimbursements() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", amount: "", description: "" });

  const { data: items, isLoading } = useQuery({ queryKey: ["my-reimbursements"], queryFn: fetchMyReimbursements });
  const mutation = useMutation({
    mutationFn: applyReimbursement,
    onSuccess: () => {
      toast({ title: "Reimbursement request submitted!" });
      queryClient.invalidateQueries({ queryKey: ["my-reimbursements"] });
      setOpen(false);
      setForm({ title: "", amount: "", description: "" });
    },
    onError: () => toast({ title: "Failed to submit", variant: "destructive" }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.amount) return;
    mutation.mutate(form);
  };

  const totalApproved = (items || []).filter((i: any) => i.status === "approved").reduce((s: number, i: any) => s + i.amount, 0);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Reimbursements</h2>
          <p className="text-muted-foreground">Apply for expense reimbursements and track their approval status.</p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2 rounded-xl">
          <Plus className="h-4 w-4" /> Apply for Reimbursement
        </Button>
      </div>

      {items && items.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="glass-panel">
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground">Total Approved</p>
              <p className="text-xl font-bold text-green-600">₹{fmt(totalApproved)}</p>
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
              <p className="text-xs text-muted-foreground">Total Requests</p>
              <p className="text-xl font-bold">{(items || []).length}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-4">
        {isLoading ? (
          [1, 2, 3].map(i => <Card key={i} className="glass-panel"><CardContent className="p-5"><Skeleton className="h-16 w-full" /></CardContent></Card>)
        ) : (items || []).map((item: any) => (
          <Card key={item.id} className="glass-panel hover:bg-muted/10 transition-colors">
            <CardContent className="p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Receipt className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{item.title}</h4>
                    {item.description && <p className="text-sm text-muted-foreground mt-0.5">{item.description}</p>}
                    <p className="text-xs text-muted-foreground mt-1">{new Date(item.createdAt).toLocaleDateString("en-IN")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 self-end sm:self-center">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Amount</p>
                    <p className="text-lg font-bold text-primary flex items-center gap-0.5"><IndianRupee className="h-4 w-4" />{fmt(item.amount)}</p>
                  </div>
                  <Badge variant="outline" className={`gap-1.5 ${statusColor(item.status)}`}>
                    {statusIcon(item.status)} {item.status}
                  </Badge>
                </div>
              </div>
              {item.rejectionReason && (
                <p className="text-xs text-destructive mt-3 bg-destructive/5 rounded-lg px-3 py-2">
                  Reason: {item.rejectionReason}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
        {!isLoading && (!items || items.length === 0) && (
          <div className="text-center py-16 glass-panel rounded-xl">
            <Receipt className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">No reimbursement requests yet.</p>
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Apply for Reimbursement</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Expense Title *</Label>
              <Input placeholder="e.g. Travel to client site, Office supplies" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
            </div>
            <div className="space-y-1.5">
              <Label>Amount (₹) *</Label>
              <Input type="number" min="1" step="0.01" placeholder="0.00" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea placeholder="Provide details about the expense..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} />
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
