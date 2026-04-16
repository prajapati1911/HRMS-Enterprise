import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export default function AdminReports() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Reports</h2>
        <p className="text-muted-foreground">Generate and export HR reports.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="glass-panel cursor-pointer hover:bg-muted/10 transition-colors group">
          <CardHeader>
            <CardTitle className="flex items-center text-primary group-hover:text-primary/80">
              <BarChart3 className="mr-2 h-5 w-5" />
              Attendance Report
            </CardTitle>
            <CardDescription>Detailed daily and employee-wise attendance stats.</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="text-sm font-medium mt-4">Click to configure and download &rarr;</div>
          </CardContent>
        </Card>

        <Card className="glass-panel cursor-pointer hover:bg-muted/10 transition-colors group">
          <CardHeader>
            <CardTitle className="flex items-center text-primary group-hover:text-primary/80">
              <BarChart3 className="mr-2 h-5 w-5" />
              Leave Report
            </CardTitle>
            <CardDescription>Leave balances, usage, and request history.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium mt-4">Click to configure and download &rarr;</div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
