import { useGetMyAttendance } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Clock } from "lucide-react";

export default function EmployeeAttendance() {
  const { data: records, isLoading } = useGetMyAttendance();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present": return "bg-green-500/10 text-green-500 border-green-500/20";
      case "absent": return "bg-red-500/10 text-red-500 border-red-500/20";
      case "late": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">My Attendance</h2>
        <p className="text-muted-foreground">View your attendance history.</p>
      </div>

      <Card className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground bg-muted/40 uppercase border-b border-border">
              <tr>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Punch In</th>
                <th className="px-6 py-4 font-medium">Punch Out</th>
                <th className="px-6 py-4 font-medium">Hours</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                [1, 2, 3, 4].map(i => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-20" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-16" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-16" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-12" /></td>
                  </tr>
                ))
              ) : records?.map((record) => (
                <tr key={record.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4 font-medium">
                     {new Date(record.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="outline" className={`capitalize ${getStatusColor(record.status)}`}>
                      {record.status.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {record.punchIn ? new Date(record.punchIn).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : '-'}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {record.punchOut ? new Date(record.punchOut).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : '-'}
                  </td>
                  <td className="px-6 py-4 font-medium">
                    {record.workingHours ? `${record.workingHours.toFixed(1)}h` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!isLoading && (!records || records.length === 0) && (
            <div className="text-center py-16 text-muted-foreground">No attendance records found.</div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
