import { useState } from "react";
import { useListLeaves, useGetMyLeaveBalance, useCreateLeaveRequest, getListLeavesQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { CalendarDays, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function EmployeeLeaves() {
  const { employee } = useAuth();
  const { data: leaves, isLoading } = useListLeaves({ employeeId: employee?.id });
  const { data: balance } = useGetMyLeaveBalance();
  const { toast } = useToast();

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
        <Button className="rounded-xl shadow-lg"><Plus className="mr-2 h-4 w-4"/> Apply Leave</Button>
      </div>

      {balance && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="glass-panel"><CardContent className="p-4 text-center">
            <div className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Casual Leave</div>
            <div className="text-2xl font-bold mt-1 text-primary">{balance.casual.remaining} <span className="text-sm font-normal text-muted-foreground">left</span></div>
          </CardContent></Card>
          <Card className="glass-panel"><CardContent className="p-4 text-center">
            <div className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Paid Leave</div>
            <div className="text-2xl font-bold mt-1 text-primary">{balance.paid.remaining} <span className="text-sm font-normal text-muted-foreground">left</span></div>
          </CardContent></Card>
          <Card className="glass-panel"><CardContent className="p-4 text-center">
            <div className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Sick Leave</div>
            <div className="text-2xl font-bold mt-1 text-primary">{balance.sick.remaining} <span className="text-sm font-normal text-muted-foreground">left</span></div>
          </CardContent></Card>
          <Card className="glass-panel"><CardContent className="p-4 text-center">
             <div className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Restricted</div>
            <div className="text-2xl font-bold mt-1 text-primary">{balance.rh.remaining} <span className="text-sm font-normal text-muted-foreground">left</span></div>
          </CardContent></Card>
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
              {isLoading ? (
                [1, 2].map(i => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-32" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-48" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-20" /></td>
                  </tr>
                ))
              ) : leaves?.map((leave) => (
                <tr key={leave.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4 capitalize font-medium">{leave.type}</td>
                  <td className="px-6 py-4">
                    <div className="font-medium">{leave.days} days</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 max-w-[200px] truncate" title={leave.reason}>{leave.reason}</td>
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
            <div className="text-center py-16 text-muted-foreground">No leave history found.</div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
