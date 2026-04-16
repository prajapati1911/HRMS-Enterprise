import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { Mail, Phone, Building, Briefcase, Hash } from "lucide-react";

export default function EmployeeProfile() {
  const { employee } = useAuth();

  if (!employee) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-4xl mx-auto">
      <div className="relative h-48 rounded-3xl bg-gradient-to-r from-primary to-blue-600 overflow-hidden mb-16">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=2000&q=80')] opacity-20 mix-blend-overlay object-cover" />
        
        <div className="absolute -bottom-12 left-8">
          <Avatar className="h-24 w-24 border-4 border-background shadow-xl">
            <AvatarImage src={employee.avatarUrl} />
            <AvatarFallback className="bg-muted text-2xl">{employee.firstName.charAt(0)}{employee.lastName.charAt(0)}</AvatarFallback>
          </Avatar>
        </div>
      </div>

      <div className="px-2">
        <h2 className="text-3xl font-bold">{employee.firstName} {employee.lastName}</h2>
        <p className="text-muted-foreground text-lg">{employee.designation || 'Employee'} • {employee.departmentName || 'No Department'}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mt-8">
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium leading-none mb-1">Email</p>
                <p className="text-sm text-muted-foreground">{employee.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium leading-none mb-1">Phone</p>
                <p className="text-sm text-muted-foreground">{employee.phone || 'Not provided'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Hash className="h-5 w-5 text-muted-foreground" />
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
              <Building className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium leading-none mb-1">Department</p>
                <p className="text-sm text-muted-foreground">{employee.departmentName || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Briefcase className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium leading-none mb-1">Role</p>
                <p className="text-sm text-muted-foreground capitalize">{employee.role}</p>
              </div>
            </div>
            <div className="pt-4 mt-2 border-t border-border/50">
               <Button variant="outline" className="w-full">Request Profile Update</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
