import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUpdateEmployee } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { Mail, Phone, Building, Briefcase, Hash, Pencil, Camera, IndianRupee } from "lucide-react";
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
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!employee) return null;

  const handleOpenEdit = () => {
    setPhone(employee.phone || "");
    setAvatarUrl(employee.avatarUrl || "");
    setAvatarPreview(null);
    setOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const b64 = ev.target?.result as string;
      setAvatarUrl(b64);
      setAvatarPreview(b64);
    };
    reader.readAsDataURL(file);
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

  const displayAvatar = avatarPreview || avatarUrl || employee.avatarUrl;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-4xl mx-auto">
      <div className="relative h-52 rounded-3xl overflow-hidden mb-16"
        style={{ background: "linear-gradient(135deg, hsl(27 96% 54%), hsl(340 75% 55%))" }}>
        <div className="absolute inset-0 opacity-20 mix-blend-overlay"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1585011664466-b7bbe92f34ef?auto=format&fit=crop&w=2000&q=80')", backgroundSize: "cover", backgroundPosition: "center" }} />
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/30 to-transparent" />
        <div className="absolute -bottom-12 left-8 flex items-end gap-4">
          <div className="relative group">
            <Avatar className="h-24 w-24 border-4 border-background shadow-xl">
              <AvatarImage src={employee.avatarUrl} />
              <AvatarFallback className="bg-primary/20 text-primary text-2xl font-bold">
                {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={handleOpenEdit}
              className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
            >
              <Camera className="h-6 w-6" />
            </button>
          </div>
          <div className="mb-1">
            <Button size="sm" variant="secondary" className="rounded-full shadow-md gap-1.5 bg-white/90 text-foreground hover:bg-white" onClick={handleOpenEdit}>
              <Pencil className="h-3.5 w-3.5" /> Edit Profile
            </Button>
          </div>
        </div>
      </div>

      <div className="px-2">
        <h2 className="text-3xl font-bold">{employee.firstName} {employee.lastName}</h2>
        <p className="text-muted-foreground text-lg">
          {employee.designation || "Employee"} · {employee.departmentName || "No Department"}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Mail className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium">{employee.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Phone className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Mobile</p>
                <p className="text-sm font-medium">{employee.phone || "Not provided"}</p>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={handleOpenEdit}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Hash className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Employee ID</p>
                <p className="text-sm font-medium font-mono">{employee.employeeCode}</p>
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
              <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Building className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Department</p>
                <p className="text-sm font-medium">{employee.departmentName || "N/A"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Briefcase className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Designation</p>
                <p className="text-sm font-medium capitalize">{employee.designation || employee.role}</p>
              </div>
            </div>
            {employee.salary && (
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <IndianRupee className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Monthly CTC</p>
                  <p className="text-sm font-medium">
                    ₹{new Intl.NumberFormat("en-IN").format(Number(employee.salary))}
                  </p>
                </div>
              </div>
            )}
            {employee.shift && (
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-muted text-muted-foreground flex items-center justify-center shrink-0 text-sm">⏰</div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Shift</p>
                  <p className="text-sm font-medium">{employee.shift}</p>
                </div>
              </div>
            )}
            {employee.joiningDate && (
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-muted text-muted-foreground flex items-center justify-center shrink-0 text-sm">📅</div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Date of Joining</p>
                  <p className="text-sm font-medium">{new Date(employee.joiningDate).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}</p>
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
            <div className="flex flex-col items-center gap-3">
              <Avatar className="h-24 w-24 border-2 border-border">
                <AvatarImage src={displayAvatar || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                  {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              <Button type="button" size="sm" variant="outline" className="gap-2" onClick={() => fileRef.current?.click()}>
                <Camera className="h-3.5 w-3.5" /> Upload Photo
              </Button>
              <p className="text-xs text-muted-foreground">JPG, PNG or GIF — Max 2MB</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phoneEdit">Mobile Number</Label>
              <Input
                id="phoneEdit"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
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
