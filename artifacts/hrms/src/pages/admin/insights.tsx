import { useGetAttendanceInsights } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { AlertTriangle, TrendingDown, TrendingUp, Minus } from "lucide-react";

export default function AdminInsights() {
  const { data, isLoading } = useGetAttendanceInsights();

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">AI Insights</h2>
        <p className="text-muted-foreground">Machine learning analysis of workforce attendance patterns.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle>Late Arrival Trends</CardTitle>
            <CardDescription>Employees with frequent late check-ins</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
            ) : data?.lateArrivals.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div>
                  <div className="font-medium">{item.employeeName}</div>
                  <div className="text-xs text-muted-foreground">{item.lateCount} late arrivals this month</div>
                </div>
                <Badge variant="outline" className={`
                  ${item.trend === 'improving' ? 'bg-green-500/10 text-green-500' : 
                    item.trend === 'worsening' ? 'bg-red-500/10 text-red-500' : 
                    'bg-gray-500/10 text-gray-500'}
                `}>
                  {item.trend === 'improving' ? <TrendingDown className="mr-1 h-3 w-3" /> : 
                   item.trend === 'worsening' ? <TrendingUp className="mr-1 h-3 w-3" /> : 
                   <Minus className="mr-1 h-3 w-3" />}
                  {item.trend}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader>
            <CardTitle>Absenteeism Risk</CardTitle>
            <CardDescription>Predicted risk of unscheduled absences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoading ? (
              Array(3).fill(0).map((_, i) => <div key={i} className="space-y-2"><Skeleton className="h-4 w-1/3" /><Skeleton className="h-2 w-full" /></div>)
            ) : data?.absenteeismRisk.map((item, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{item.employeeName}</span>
                  <span className={`${item.riskScore > 70 ? 'text-destructive' : item.riskScore > 40 ? 'text-amber-500' : 'text-green-500'}`}>
                    {item.riskScore}% Risk
                  </span>
                </div>
                <Progress value={item.riskScore} className="h-2" />
                <p className="text-xs text-muted-foreground">{item.reason}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="glass-panel md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5 text-amber-500" />
              Anomaly Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
               <Skeleton className="h-20 w-full" />
            ) : data?.anomalies.map((anomaly, i) => (
              <div key={i} className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 mb-3 last:mb-0">
                <h4 className="font-semibold">{anomaly.type}</h4>
                <p className="text-sm mt-1">{anomaly.message}</p>
                {anomaly.employeeName && <p className="text-xs font-medium mt-2 text-amber-600/80">Affects: {anomaly.employeeName}</p>}
              </div>
            ))}
            {!isLoading && data?.anomalies.length === 0 && (
              <div className="text-center py-6 text-muted-foreground">No anomalies detected.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
