import { useListPayroll, useGeneratePayroll, getListPayrollQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Banknote, Calculator, Download, CheckCircle, IndianRupee } from "lucide-react";
import { useState } from "react";

const BASE = "/api";

function fmt(n: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(n);
}

async function approvePayroll(id: number, status: string, token: string) {
  const res = await fetch(`${BASE}/payroll/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Failed");
  return res.json();
}

export default function AdminPayroll() {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const { data: payrolls, isLoading } = useListPayroll({ month: currentMonth, year: currentYear });
  const generatePayroll = useGeneratePayroll();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);
  const [approvingId, setApprovingId] = useState<number | null>(null);

  const monthName = new Date(0, currentMonth - 1).toLocaleString("default", { month: "long" });

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await generatePayroll.mutateAsync({ data: { month: currentMonth, year: currentYear } });
      toast({ title: "Payroll generated with Indian PF & Tax deductions" });
      queryClient.invalidateQueries({ queryKey: getListPayrollQueryKey() });
    } catch {
      toast({ title: "Failed to generate payroll", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApprove = async (id: number) => {
    setApprovingId(id);
    try {
      const token = localStorage.getItem("hrms_token") || "";
      await approvePayroll(id, "paid", token);
      toast({ title: "Salary marked as Paid" });
      queryClient.invalidateQueries({ queryKey: getListPayrollQueryKey() });
    } catch {
      toast({ title: "Failed to update status", variant: "destructive" });
    } finally {
      setApprovingId(null);
    }
  };

  const handleExport = () => {
    const token = localStorage.getItem("hrms_token") || "";
    const url = `${BASE}/payroll/export?month=${currentMonth}&year=${currentYear}`;
    const a = document.createElement("a");
    a.href = url + `&token=${token}`;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob())
      .then(blob => {
        const objUrl = URL.createObjectURL(blob);
        a.href = objUrl;
        a.download = `payroll-${monthName}-${currentYear}.xlsx`;
        a.click();
        URL.revokeObjectURL(objUrl);
      })
      .catch(() => toast({ title: "Export failed", variant: "destructive" }));
  };

  const statusColor = (s: string) => {
    if (s === "paid") return "bg-green-500/10 text-green-600 border-green-500/20";
    if (s === "processed") return "bg-primary/10 text-primary border-primary/20";
    return "bg-amber-500/10 text-amber-600 border-amber-500/20";
  };

  const totalNet = (payrolls || []).reduce((s, p) => s + Number(p.netSalary || 0), 0);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Payroll Management</h2>
          <p className="text-muted-foreground">Salary processing for {monthName} {currentYear}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleExport} variant="outline" className="rounded-xl gap-2">
            <Download className="h-4 w-4" /> Export Excel
          </Button>
          <Button onClick={handleGenerate} disabled={isGenerating} className="rounded-xl gap-2">
            <Calculator className="h-4 w-4" />
            {isGenerating ? "Processing..." : "Generate Payroll"}
          </Button>
        </div>
      </div>

      {payrolls && payrolls.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="glass-panel">
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground">Total Payout</p>
              <p className="text-xl font-bold text-primary flex items-center gap-1"><IndianRupee className="h-4 w-4" />{fmt(totalNet)}</p>
            </CardContent>
          </Card>
          <Card className="glass-panel">
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground">Employees</p>
              <p className="text-xl font-bold">{payrolls.length}</p>
            </CardContent>
          </Card>
          <Card className="glass-panel">
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground">Paid</p>
              <p className="text-xl font-bold text-green-600">{payrolls.filter(p => p.status === "paid").length}</p>
            </CardContent>
          </Card>
          <Card className="glass-panel">
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground">Pending</p>
              <p className="text-xl font-bold text-amber-600">{payrolls.filter(p => p.status !== "paid").length}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="glass-panel">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground bg-muted/40 uppercase border-b border-border">
              <tr>
                <th className="px-4 py-4 font-medium">Employee</th>
                <th className="px-4 py-4 font-medium">Basic (₹)</th>
                <th className="px-4 py-4 font-medium">PF (12%)</th>
                <th className="px-4 py-4 font-medium">Tax (TDS)</th>
                <th className="px-4 py-4 font-medium">Overtime</th>
                <th className="px-4 py-4 font-medium">Reimb.</th>
                <th className="px-4 py-4 font-medium">Days (P/A)</th>
                <th className="px-4 py-4 font-medium font-bold">Net Salary</th>
                <th className="px-4 py-4 font-medium">Status</th>
                <th className="px-4 py-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                [1, 2, 3].map(i => (
                  <tr key={i}>
                    {[...Array(10)].map((_, j) => (
                      <td key={j} className="px-4 py-4"><Skeleton className="h-5 w-20" /></td>
                    ))}
                  </tr>
                ))
              ) : payrolls?.map((payroll) => (
                <tr key={payroll.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-4 font-medium">
                    <div>{(payroll as any).employeeName}</div>
                    <div className="text-xs text-muted-foreground">{(payroll as any).employeeCode}</div>
                  </td>
                  <td className="px-4 py-4">₹{fmt(payroll.basicSalary as any)}</td>
                  <td className="px-4 py-4 text-destructive">-₹{fmt((payroll as any).pfDeduction || 0)}</td>
                  <td className="px-4 py-4 text-destructive">-₹{fmt((payroll as any).taxDeduction || 0)}</td>
                  <td className="px-4 py-4 text-green-600">+₹{fmt(payroll.overtimePay as any)}</td>
                  <td className="px-4 py-4 text-blue-600">+₹{fmt((payroll as any).reimbursementAmount || 0)}</td>
                  <td className="px-4 py-4 text-muted-foreground">{payroll.presentDays}/{payroll.absentDays}</td>
                  <td className="px-4 py-4 font-bold text-primary">₹{fmt(payroll.netSalary as any)}</td>
                  <td className="px-4 py-4">
                    <Badge variant="outline" className={statusColor(payroll.status || "draft")}>
                      {payroll.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-4 text-right">
                    {payroll.status !== "paid" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1 border-green-500/30 text-green-600 hover:bg-green-500/10"
                        disabled={approvingId === payroll.id}
                        onClick={() => handleApprove(payroll.id)}
                      >
                        <CheckCircle className="h-3 w-3" />
                        {approvingId === payroll.id ? "..." : "Mark Paid"}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!isLoading && (!payrolls || payrolls.length === 0) && (
            <div className="text-center py-16">
              <Banknote className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No payroll records for this month.</p>
              <p className="text-xs text-muted-foreground mt-1">Click 'Generate Payroll' to process salaries.</p>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
