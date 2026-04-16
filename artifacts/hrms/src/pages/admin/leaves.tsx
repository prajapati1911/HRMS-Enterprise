import { useListLeaves, useUpdateLeave, getListLeavesQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, XCircle } from "lucide-react";

export default function AdminLeaves() {
  const { data: leaves, isLoading } = useListLeaves();
  const updateLeave = useUpdateLeave();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleAction = async (id: number, status: "approved" | "rejected") => {
    try {
      await updateLeave.mutateAsync({ id, data: { status } });
      toast({ title: `Leave request ${status}` });
      queryClient.invalidateQueries({ queryKey: getListLeavesQueryKey() });
    } catch (e) {
      toast({ title: "Failed to update leave request", variant: "destructive" });
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
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Leave Requests</h2>
        <p className="text-muted-foreground">Manage employee time off and absences.</p>
      </div>

      <Card className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground bg-muted/40 uppercase border-b border-border">
              <tr>
                <th className="px-6 py-4 font-medium">Employee</th>
                <th className="px-6 py-4 font-medium">Leave Type</th>
                <th className="px-6 py-4 font-medium">Duration</th>
                <th className="px-6 py-4 font-medium">Reason</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                [1, 2, 3].map(i => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-32" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-32" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-48" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-20" /></td>
                    <td className="px-6 py-4 text-right"><Skeleton className="h-8 w-24 ml-auto" /></td>
                  </tr>
                ))
              ) : leaves?.map((leave) => (
                <tr key={leave.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4 font-medium">{leave.employeeName}</td>
                  <td className="px-6 py-4 capitalize">{leave.type}</td>
                  <td className="px-6 py-4">
                    <div className="font-medium">{leave.days} days</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 max-w-[200px] truncate" title={leave.reason}>{leave.reason}</td>
                  <td className="px-6 py-4">
                    <Badge variant="outline" className={getStatusColor(leave.status)}>
                      {leave.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    {leave.status === 'pending' && (
                      <>
                        <Button size="sm" variant="outline" className="h-8 text-green-500 hover:text-green-600 hover:bg-green-500/10" onClick={() => handleAction(leave.id, "approved")}>
                          <CheckCircle2 className="mr-1.5 h-4 w-4" /> Approve
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleAction(leave.id, "rejected")}>
                          <XCircle className="mr-1.5 h-4 w-4" /> Reject
                        </Button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!isLoading && (!leaves || leaves.length === 0) && (
            <div className="text-center py-12 text-muted-foreground">No leave requests found.</div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
