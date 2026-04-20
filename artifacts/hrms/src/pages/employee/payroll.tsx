import { useGetMyPayroll } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { FileText, IndianRupee, TrendingDown, TrendingUp, Clock } from "lucide-react";

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function fmt(n: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(n);
}

export default function EmployeePayroll() {
  const { data: payrolls, isLoading } = useGetMyPayroll();

  const statusColor = (s: string) => {
    if (s === "paid") return "bg-green-500/10 text-green-600 border-green-500/20";
    if (s === "processed") return "bg-primary/10 text-primary border-primary/20";
    return "bg-amber-500/10 text-amber-600 border-amber-500/20";
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">My Payslips</h2>
        <p className="text-muted-foreground">View your monthly salary details including PF and tax deductions.</p>
      </div>

      <div className="grid gap-5">
        {isLoading ? (
          [1, 2].map(i => <Card key={i} className="glass-panel"><CardContent className="p-6"><Skeleton className="h-32 w-full" /></CardContent></Card>)
        ) : payrolls?.map((payroll) => {
          const pf = Number((payroll as any).pfDeduction || 0);
          const tax = Number((payroll as any).taxDeduction || 0);
          const absent = Number((payroll as any).absentDeduction || 0);
          const reimb = Number((payroll as any).reimbursementAmount || 0);
          return (
            <Card key={payroll.id} className="glass-panel">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-xl font-bold">{months[payroll.month - 1]} {payroll.year}</h3>
                        <Badge variant="outline" className={statusColor(payroll.status || "draft")}>
                          {payroll.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <div className="bg-muted/30 rounded-xl p-3">
                          <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                            <IndianRupee className="h-3 w-3" /> Basic Salary
                          </div>
                          <div className="font-bold">₹{fmt(Number(payroll.basicSalary))}</div>
                        </div>
                        {pf > 0 && (
                          <div className="bg-destructive/5 rounded-xl p-3">
                            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                              <TrendingDown className="h-3 w-3 text-destructive" /> PF Deduction (12%)
                            </div>
                            <div className="font-bold text-destructive">-₹{fmt(pf)}</div>
                          </div>
                        )}
                        {tax > 0 && (
                          <div className="bg-destructive/5 rounded-xl p-3">
                            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                              <TrendingDown className="h-3 w-3 text-destructive" /> TDS (Income Tax)
                            </div>
                            <div className="font-bold text-destructive">-₹{fmt(tax)}</div>
                          </div>
                        )}
                        {absent > 0 && (
                          <div className="bg-destructive/5 rounded-xl p-3">
                            <div className="text-xs text-muted-foreground mb-1">Absent Deduction</div>
                            <div className="font-bold text-destructive">-₹{fmt(absent)}</div>
                          </div>
                        )}
                        {Number(payroll.overtimePay) > 0 && (
                          <div className="bg-green-500/5 rounded-xl p-3">
                            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                              <Clock className="h-3 w-3 text-green-600" /> Overtime ({payroll.overtimeHours}h)
                            </div>
                            <div className="font-bold text-green-600">+₹{fmt(Number(payroll.overtimePay))}</div>
                          </div>
                        )}
                        {reimb > 0 && (
                          <div className="bg-blue-500/5 rounded-xl p-3">
                            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                              <TrendingUp className="h-3 w-3 text-blue-600" /> Reimbursement
                            </div>
                            <div className="font-bold text-blue-600">+₹{fmt(reimb)}</div>
                          </div>
                        )}
                        <div className="bg-primary/10 rounded-xl p-3 border border-primary/20">
                          <div className="text-xs text-muted-foreground mb-1 font-medium">Net Salary</div>
                          <div className="text-xl font-bold text-primary">₹{fmt(Number(payroll.netSalary))}</div>
                        </div>
                      </div>

                      <div className="mt-3 text-xs text-muted-foreground flex gap-4">
                        <span>Present: {payroll.presentDays} days</span>
                        <span>Absent: {payroll.absentDays} days</span>
                        <span>Leave: {payroll.leaveDays} days</span>
                        <span>Working Days: {payroll.workingDays}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {!isLoading && (!payrolls || payrolls.length === 0) && (
          <div className="text-center py-16 text-muted-foreground glass-panel rounded-xl">
            No payslips available yet.
          </div>
        )}
      </div>
    </motion.div>
  );
}
