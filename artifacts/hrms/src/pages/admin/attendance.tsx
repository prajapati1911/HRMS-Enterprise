import { useGetLiveAttendance } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { MapPin, Clock } from "lucide-react";

export default function AdminAttendance() {
  const { data, isLoading } = useGetLiveAttendance({ query: { refetchInterval: 30000 } });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present": return "bg-green-500/10 text-green-500 border-green-500/20";
      case "absent": return "bg-red-500/10 text-red-500 border-red-500/20";
      case "late": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "half_day": return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      case "on_leave": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "holiday": return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Live Attendance</h2>
        <p className="text-muted-foreground">Real-time view of today's workforce attendance.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Total", value: data?.totalEmployees, color: "text-foreground" },
          { label: "Present", value: data?.presentCount, color: "text-green-500" },
          { label: "Late", value: data?.lateCount, color: "text-amber-500" },
          { label: "Absent/Leave", value: (data?.absentCount || 0) + (data?.onLeaveCount || 0), color: "text-muted-foreground" },
        ].map((stat, i) => (
          <Card key={i} className="glass-panel">
            <CardContent className="p-6">
              <div className="text-sm font-medium text-muted-foreground">{stat.label}</div>
              <div className={`text-3xl font-bold mt-1 ${stat.color}`}>
                {isLoading ? <Skeleton className="h-8 w-16" /> : stat.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="glass-panel">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground bg-muted/40 uppercase border-b border-border">
              <tr>
                <th className="px-6 py-4 font-medium">Employee</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Punch In</th>
                <th className="px-6 py-4 font-medium">Punch Out</th>
                <th className="px-6 py-4 font-medium">Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                [1, 2, 3, 4].map(i => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-32" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-20" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-16" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-16" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-24" /></td>
                  </tr>
                ))
              ) : data?.records?.map((record) => (
                <tr key={record.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4 font-medium">{record.employeeName}</td>
                  <td className="px-6 py-4">
                    <Badge variant="outline" className={getStatusColor(record.status)}>
                      {record.status.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    {record.punchIn ? (
                      <div className="flex items-center text-muted-foreground">
                        <Clock className="mr-1.5 h-3 w-3" />
                        {new Date(record.punchIn).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    ) : '-'}
                  </td>
                  <td className="px-6 py-4">
                    {record.punchOut ? (
                      <div className="flex items-center text-muted-foreground">
                        <Clock className="mr-1.5 h-3 w-3" />
                        {new Date(record.punchOut).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    ) : '-'}
                  </td>
                  <td className="px-6 py-4">
                    {record.punchInLocation ? (
                      <div className="flex items-center text-muted-foreground">
                        <MapPin className="mr-1.5 h-3 w-3" />
                        {record.isWithinGeofence ? <span className="text-green-500">In Office</span> : <span className="text-amber-500">Remote</span>}
                      </div>
                    ) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!isLoading && (!data?.records || data.records.length === 0) && (
            <div className="text-center py-12 text-muted-foreground">No attendance records found for today.</div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
