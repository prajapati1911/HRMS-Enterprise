import { useState } from "react";
import {
  useListDepartments,
  useCreateDepartment,
  useDeleteDepartment,
  getListDepartmentsQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function AdminDepartments() {
  const { data: departments, isLoading } = useListDepartments();
  const createDept = useCreateDepartment();
  const deleteDept = useDeleteDepartment();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleOpen = () => {
    setName("");
    setCode("");
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await createDept.mutateAsync({ data: { name: name.trim(), code: code.trim() || undefined } });
      toast({ title: "Department added successfully" });
      queryClient.invalidateQueries({ queryKey: getListDepartmentsQueryKey() });
      setOpen(false);
    } catch {
      toast({ title: "Failed to add department", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this department?")) return;
    try {
      await deleteDept.mutateAsync({ id });
      toast({ title: "Department deleted" });
      queryClient.invalidateQueries({ queryKey: getListDepartmentsQueryKey() });
    } catch {
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
        <Button onClick={handleOpen} className="rounded-xl shadow-lg">
          <Plus className="mr-2 h-4 w-4" /> Add Department
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? [1, 2, 3].map((i) => (
              <Card key={i} className="glass-panel">
                <CardContent className="p-6">
                  <Skeleton className="h-24 w-full" />
                </CardContent>
              </Card>
            ))
          : departments?.map((dept) => (
              <Card key={dept.id} className="glass-panel hover:bg-muted/10 transition-colors">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg">{dept.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1 font-mono">{dept.code || "NO-CODE"}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(dept.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-4 pt-4 border-t border-border/50">
                    <div className="flex items-center gap-1.5">
                      <Users className="h-4 w-4" /> {dept.employeeCount || 0} Members
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        {!isLoading && departments?.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            No departments yet. Add one to get started.
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Department</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="deptName">Department Name *</Label>
              <Input
                id="deptName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Engineering"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="deptCode">Code</Label>
              <Input
                id="deptCode"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. ENG"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Adding..." : "Add Department"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
