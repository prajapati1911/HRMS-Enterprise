import { useState } from "react";
import {
  useListLeaves,
  useGetMyLeaveBalance,
  useCreateLeaveRequest,
  getListLeavesQueryKey,
  CreateLeaveBodyType,
} from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { CalendarDays, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const LEAVE_TYPES = [
  { value: "casual", label: "Casual Leave" },
  { value: "paid", label: "Paid Leave" },
  { value: "sick", label: "Sick Leave" },
  { value: "rh", label: "Restricted Holiday" },
  { value: "maternity", label: "Maternity Leave" },
  { value: "paternity", label: "Paternity Leave" },
  { value: "unpaid", label: "Unpaid Leave" },
];

const EMPTY = { type: "casual" as CreateLeaveBodyType, startDate: "", endDate: "", reason: "" };

export default function EmployeeLeaves() {
  const { employee } = useAuth();
  const { data: leaves, isLoading } = useListLeaves({ employeeId: employee?.id });
  const { data: balance } = useGetMyLeaveBalance();
  const createLeave = useCreateLeaveRequest();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });
  const [submitting, setSubmitting] = useState(false);

  const handleOpen = () => {
    setForm({ ...EMPTY });
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.startDate || !form.endDate || !form.reason.trim()) return;
    if (new Date(form.endDate) < new Date(form.startDate)) {
      toast({ title: "End date must be after start date", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await createLeave.mutateAsync({
        data: {
          type: form.type,
          startDate: form.startDate,
          endDate: form.endDate,
          reason: form.reason.trim(),
        },
      });
      toast({ title: "Leave request submitted successfully" });
      queryClient.invalidateQueries({ queryKey: getListLeavesQueryKey() });
      setOpen(false);
    } catch {
      toast({ title: "Failed to submit leave request", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-green-500/10 text-green-500 border-green-500/20";
      case "rejected": return "bg-red-500/10 text-red-500 border-red-500/20";
      case "pending": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">My Leaves</h2>
          <p className="text-muted-foreground">Manage your time off.</p>
        </div>
        <Button onClick={handleOpen} className="rounded-xl shadow-lg">
          <Plus className="mr-2 h-4 w-4" /> Apply Leave
        </Button>
      </div>

      {balance && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Casual Leave", data: balance.casual },
            { label: "Paid Leave", data: balance.paid },
            { label: "Sick Leave", data: balance.sick },
            { label: "Restricted", data: balance.rh },
          ].map(({ label, data }) => (
            <Card key={label} className="glass-panel">
              <CardContent className="p-4 text-center">
                <div className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">{label}</div>
                <div className="text-2xl font-bold mt-1 text-primary">
                  {data.remaining}{" "}
                  <span className="text-sm font-normal text-muted-foreground">/ {data.total}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="glass-panel">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground bg-muted/40 uppercase border-b border-border">
              <tr>
                <th className="px-6 py-4 font-medium">Leave Type</th>
                <th className="px-6 py-4 font-medium">Duration</th>
                <th className="px-6 py-4 font-medium">Reason</th>
                <th className="px-6 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading
                ? [1, 2].map((i) => (
                    <tr key={i}>
                      <td className="px-6 py-4"><Skeleton className="h-5 w-24" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-5 w-32" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-5 w-48" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-6 w-20" /></td>
                    </tr>
                  ))
                : leaves?.map((leave) => (
                    <tr key={leave.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4 capitalize font-medium">{leave.type.replace("_", " ")}</td>
                      <td className="px-6 py-4">
                        <div className="font-medium">{leave.days} days</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(leave.startDate).toLocaleDateString()} -{" "}
                          {new Date(leave.endDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 max-w-[200px] truncate" title={leave.reason}>
                        {leave.reason}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className={`capitalize ${getStatusColor(leave.status)}`}>
                          {leave.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
          {!isLoading && (!leaves || leaves.length === 0) && (
            <div className="text-center py-16 text-muted-foreground flex flex-col items-center gap-2">
              <CalendarDays className="h-8 w-8 text-muted-foreground/50" />
              No leave history found.
            </div>
          )}
        </div>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Apply for Leave</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Leave Type *</Label>
              <Select
                value={form.type}
                onValueChange={(v) => setForm({ ...form, type: v as CreateLeaveBodyType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEAVE_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Start Date *</Label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>End Date *</Label>
                <Input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Reason *</Label>
              <Textarea
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                placeholder="Briefly describe your reason..."
                rows={3}
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Request"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
