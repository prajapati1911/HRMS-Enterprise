import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await login({ email, password });
      toast({ title: "Swagat hai!", description: "Successfully logged in." });
    } catch {
      toast({ title: "Login failed", description: "Invalid credentials. Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const setDemoCredentials = (role: "admin" | "employee") => {
    if (role === "admin") { setEmail("admin@hrms.com"); setPassword("admin123"); }
    else { setEmail("emp@hrms.com"); setPassword("emp123"); }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Indian branding */}
      <div className="hidden lg:flex flex-1 relative items-center justify-center overflow-hidden"
        style={{ background: "linear-gradient(135deg, hsl(27 96% 54% / 0.15), hsl(340 75% 55% / 0.1))" }}>
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-background z-0" />
        <div className="relative z-10 p-12 max-w-lg">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div className="flex items-center gap-3 mb-8">
              <div className="h-16 w-16 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-xl"
                style={{ background: "linear-gradient(135deg, hsl(27 96% 54%), hsl(340 75% 55%))" }}>
                भा
              </div>
              <div>
                <h1 className="text-2xl font-bold text-primary">BharatHR</h1>
                <p className="text-xs text-muted-foreground">Human Resource Management</p>
              </div>
            </div>
            <h2 className="text-4xl font-bold tracking-tight mb-6 text-foreground leading-tight">
              Streamline your workforce management.
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              A complete Indian HR solution — attendance, payroll with PF & TDS, reimbursements, and on-duty management.
            </p>

            <div className="mt-10 grid grid-cols-2 gap-4">
              {[
                { icon: "🕐", label: "Attendance Tracking", sub: "Geofence-enabled" },
                { icon: "💰", label: "Indian Payroll", sub: "PF + TDS calculated" },
                { icon: "📋", label: "Reimbursements", sub: "Quick approval flow" },
                { icon: "📍", label: "On-Duty", sub: "Field duty tracking" },
              ].map(f => (
                <div key={f.label} className="flex items-start gap-3 p-4 rounded-2xl bg-card/50 border border-card-border/50">
                  <span className="text-2xl">{f.icon}</span>
                  <div>
                    <p className="font-semibold text-sm">{f.label}</p>
                    <p className="text-xs text-muted-foreground">{f.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
        <div className="absolute top-1/4 right-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-10 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 z-10 relative">
        <div className="w-full max-w-sm space-y-8 glass-panel p-10 rounded-3xl">
          <div className="text-center">
            <div className="h-12 w-12 rounded-xl flex items-center justify-center text-white font-bold text-xl mx-auto mb-4"
              style={{ background: "linear-gradient(135deg, hsl(27 96% 54%), hsl(340 75% 55%))" }}>
              भा
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Welcome to BharatHR</h2>
            <p className="text-sm text-muted-foreground mt-2">Sign in to access your HR portal</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12"
                />
              </div>
            </div>

            <Button type="submit" className="w-full h-12 text-base font-medium shadow-lg" disabled={isSubmitting}>
              {isSubmitting ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="pt-6 border-t border-border/50">
            <p className="text-sm text-center text-muted-foreground mb-4">Demo Accounts</p>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-10 text-xs" onClick={() => setDemoCredentials("admin")}>
                HR Admin
              </Button>
              <Button variant="outline" className="h-10 text-xs" onClick={() => setDemoCredentials("employee")}>
                Employee
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
