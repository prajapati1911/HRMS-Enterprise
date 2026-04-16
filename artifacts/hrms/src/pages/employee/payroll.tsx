import { useGetMyPayroll } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Download, FileText } from "lucide-react";

export default function EmployeePayroll() {
  const { data: payrolls, isLoading } = useGetMyPayroll();

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Payslips</h2>
        <p className="text-muted-foreground">View and download your monthly salary slips.</p>
      </div>

      <div className="grid gap-6">
        {isLoading ? (
          [1, 2].map(i => <Card key={i} className="glass-panel"><CardContent className="p-6"><Skeleton className="h-24 w-full" /></CardContent></Card>)
        ) : payrolls?.map((payroll) => (
          <Card key={payroll.id} className="glass-panel hover:bg-muted/10 transition-colors">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{months[payroll.month - 1]} {payroll.year}</h3>
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      <span>Basic: ${payroll.basicSalary}</span>
                      <span>•</span>
                      <span className="text-destructive">Deductions: -${payroll.deductions}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-6 self-start sm:self-center w-full sm:w-auto">
                  <div className="text-left sm:text-right flex-1 sm:flex-initial">
                    <div className="text-sm text-muted-foreground mb-1">Net Pay</div>
                    <div className="text-2xl font-bold text-foreground">${payroll.netSalary}</div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant="outline" className={`
                      ${payroll.status === 'paid' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                        payroll.status === 'processed' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 
                        'bg-amber-500/10 text-amber-500 border-amber-500/20'}
                    `}>
                      {payroll.status}
                    </Badge>
                    <Button size="sm" variant="secondary" className="h-8" disabled={payroll.status === 'draft'}>
                      <Download className="mr-1.5 h-3 w-3" /> Download PDF
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {!isLoading && (!payrolls || payrolls.length === 0) && (
          <div className="text-center py-16 text-muted-foreground glass-panel rounded-xl">
             No payslips available yet.
          </div>
        )}
      </div>
    </motion.div>
  );
}
