import { useListPayroll, useGeneratePayroll, getListPayrollQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Banknote, Calculator } from "lucide-react";
import { useState } from "react";

export default function AdminPayroll() {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  
  const { data: payrolls, isLoading } = useListPayroll({ month: currentMonth, year: currentYear });
  const generatePayroll = useGeneratePayroll();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await generatePayroll.mutateAsync({ data: { month: currentMonth, year: currentYear } });
      toast({ title: "Payroll generated successfully" });
      queryClient.invalidateQueries({ queryKey: getListPayrollQueryKey() });
    } catch (e) {
      toast({ title: "Failed to generate payroll", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Payroll Management</h2>
          <p className="text-muted-foreground">Manage salary processing for {new Date(0, currentMonth - 1).toLocaleString('default', { month: 'long' })} {currentYear}.</p>
        </div>
        <Button onClick={handleGenerate} disabled={isGenerating} className="shadow-lg rounded-xl">
          <Calculator className="mr-2 h-4 w-4" /> 
          {isGenerating ? "Processing..." : "Generate Payroll"}
        </Button>
      </div>

      <Card className="glass-panel">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground bg-muted/40 uppercase border-b border-border">
              <tr>
                <th className="px-6 py-4 font-medium">Employee</th>
                <th className="px-6 py-4 font-medium">Basic</th>
                <th className="px-6 py-4 font-medium">Days (P/A)</th>
                <th className="px-6 py-4 font-medium">Deductions</th>
                <th className="px-6 py-4 font-medium">Net Salary</th>
                <th className="px-6 py-4 font-medium text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                [1, 2, 3].map(i => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-32" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-20" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-16" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-20" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-24" /></td>
                    <td className="px-6 py-4 text-right"><Skeleton className="h-6 w-20 ml-auto" /></td>
                  </tr>
                ))
              ) : payrolls?.map((payroll) => (
                <tr key={payroll.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4 font-medium">{payroll.employeeName}</td>
                  <td className="px-6 py-4 text-muted-foreground">${payroll.basicSalary}</td>
                  <td className="px-6 py-4 text-muted-foreground">{payroll.presentDays} / {payroll.absentDays}</td>
                  <td className="px-6 py-4 text-destructive">-${payroll.deductions}</td>
                  <td className="px-6 py-4 font-bold">${payroll.netSalary}</td>
                  <td className="px-6 py-4 text-right">
                    <Badge variant="outline" className={`
                      ${payroll.status === 'paid' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                        payroll.status === 'processed' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 
                        'bg-amber-500/10 text-amber-500 border-amber-500/20'}
                    `}>
                      {payroll.status}
                    </Badge>
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
