import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUpdateEmployee } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { Mail, Phone, Building, Briefcase, Hash, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function EmployeeProfile() {
  const { employee, login } = useAuth();
  const updateEmployee = useUpdateEmployee();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!employee) return null;

  const handleOpenEdit = () => {
    setPhone(employee.phone || "");
    setAvatarUrl(employee.avatarUrl || "");
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const updated = await updateEmployee.mutateAsync({
        id: employee.id,
        data: {
          phone: phone || undefined,
          avatarUrl: avatarUrl || undefined,
        },
      });
      localStorage.setItem("hrms_user", JSON.stringify(updated));
      window.location.reload();
      toast({ title: "Profile updated successfully" });
      setOpen(false);
    } catch {
      toast({ title: "Failed to update profile", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-4xl mx-auto">
      <div className="relative h-48 rounded-3xl bg-gradient-to-r from-primary to-blue-600 overflow-hidden mb-16">
        <div className="absolute inset-0 bg-cover bg-center opacity-20 mix-blend-overlay" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=2000&q=80')" }} />
        <div className="absolute -bottom-12 left-8 flex items-end gap-4">
          <Avatar className="h-24 w-24 border-4 border-background shadow-xl">
            <AvatarImage src={employee.avatarUrl} />
            <AvatarFallback className="bg-muted text-2xl">
              {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="mb-1">
            <Button
              size="sm"
              variant="secondary"
              className="rounded-full shadow-md gap-1.5"
              onClick={handleOpenEdit}
            >
              <Pencil className="h-3.5 w-3.5" /> Edit Profile
            </Button>
          </div>
        </div>
      </div>

      <div className="px-2">
        <h2 className="text-3xl font-bold">{employee.firstName} {employee.lastName}</h2>
        <p className="text-muted-foreground text-lg">
          {employee.designation || "Employee"} • {employee.departmentName || "No Department"}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mt-8">
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium leading-none mb-1">Email</p>
                <p className="text-sm text-muted-foreground">{employee.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-muted-foreground shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium leading-none mb-1">Phone</p>
                <p className="text-sm text-muted-foreground">{employee.phone || "Not provided"}</p>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={handleOpenEdit}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <Hash className="h-5 w-5 text-muted-foreground shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium leading-none mb-1">Employee Code</p>
                <p className="text-sm text-muted-foreground font-mono">{employee.employeeCode}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader>
            <CardTitle>Work Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Building className="h-5 w-5 text-muted-foreground shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium leading-none mb-1">Department</p>
                <p className="text-sm text-muted-foreground">{employee.departmentName || "N/A"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Briefcase className="h-5 w-5 text-muted-foreground shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium leading-none mb-1">Role</p>
                <p className="text-sm text-muted-foreground capitalize">{employee.role}</p>
              </div>
            </div>
            {employee.shift && (
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 text-muted-foreground shrink-0 flex items-center justify-center text-xs font-bold">⏰</div>
                <div className="flex-1">
                  <p className="text-sm font-medium leading-none mb-1">Shift</p>
                  <p className="text-sm text-muted-foreground">{employee.shift}</p>
                </div>
              </div>
            )}
            {employee.joiningDate && (
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 text-muted-foreground shrink-0 flex items-center justify-center text-xs font-bold">📅</div>
                <div className="flex-1">
                  <p className="text-sm font-medium leading-none mb-1">Joining Date</p>
                  <p className="text-sm text-muted-foreground">{new Date(employee.joiningDate).toLocaleDateString()}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="flex justify-center">
              <Avatar className="h-20 w-20 border-2 border-border">
                <AvatarImage src={avatarUrl || employee.avatarUrl} />
                <AvatarFallback className="text-xl">
                  {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="avatarUrl">Profile Picture URL</Label>
              <Input
                id="avatarUrl"
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/photo.jpg"
              />
              <p className="text-xs text-muted-foreground">Paste a direct link to your photo.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phoneEdit">Phone Number</Label>
              <Input
                id="phoneEdit"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 234 567 8900"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
