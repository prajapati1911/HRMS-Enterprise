import { useListDepartments, useCreateDepartment, useDeleteDepartment, getListDepartmentsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Users } from "lucide-react";

export default function AdminDepartments() {
  const { data: departments, isLoading } = useListDepartments();
  const deleteDept = useDeleteDepartment();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleDelete = async (id: number) => {
    if (!confirm("Delete department?")) return;
    try {
      await deleteDept.mutateAsync({ id });
      toast({ title: "Department deleted" });
      queryClient.invalidateQueries({ queryKey: getListDepartmentsQueryKey() });
    } catch (e) {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Departments</h2>
          <p className="text-muted-foreground">Manage organizational structure.</p>
        </div>
        <Button className="rounded-xl shadow-lg"><Plus className="mr-2 h-4 w-4"/> Add Department</Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          [1,2,3].map(i => <Card key={i} className="glass-panel"><CardContent className="p-6"><Skeleton className="h-24 w-full"/></CardContent></Card>)
        ) : departments?.map((dept) => (
          <Card key={dept.id} className="glass-panel hover:bg-muted/10 transition-colors">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg">{dept.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1 font-mono">{dept.code || 'NO-CODE'}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(dept.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-4 pt-4 border-t border-border/50">
                <div className="flex items-center gap-1.5"><Users className="h-4 w-4"/> {dept.employeeCount || 0} Members</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </motion.div>
  );
}
