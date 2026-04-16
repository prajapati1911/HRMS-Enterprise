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
      toast({
        title: "Welcome back",
        description: "Successfully logged in.",
      });
    } catch (error) {
      toast({
        title: "Login failed",
        description: "Invalid credentials. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const setDemoCredentials = (role: "admin" | "employee") => {
    if (role === "admin") {
      setEmail("admin@hrms.com");
      setPassword("admin123");
    } else {
      setEmail("emp@hrms.com");
      setPassword("emp123");
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Branding/Visual */}
      <div className="hidden lg:flex flex-1 relative bg-primary/5 items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-background z-0" />
        
        <div className="relative z-10 p-12 max-w-lg">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="h-16 w-16 bg-primary rounded-2xl flex items-center justify-center text-primary-foreground font-bold text-3xl mb-8 shadow-xl shadow-primary/20">
              H
            </div>
            <h1 className="text-5xl font-bold tracking-tight mb-6 text-foreground">
              Command your workforce with clarity.
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              A premium, enterprise-grade HRMS designed for speed, confidence, and seamless operations.
            </p>
          </motion.div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-1/4 right-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 z-10 relative">
        <div className="w-full max-w-sm space-y-8 glass-panel p-10 rounded-3xl">
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight">Sign in to HRMS</h2>
            <p className="text-sm text-muted-foreground mt-2">Enter your details to access your workspace</p>
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
                  className="bg-background/50 h-12"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <a href="#" className="text-xs font-medium text-primary hover:underline">Forgot password?</a>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-background/50 h-12"
                />
              </div>
            </div>

            <Button type="submit" className="w-full h-12 text-base font-medium shadow-lg" disabled={isSubmitting}>
              {isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <div className="pt-6 border-t border-border/50">
            <p className="text-sm text-center text-muted-foreground mb-4">Demo Accounts</p>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="bg-background/50 h-10 text-xs" onClick={() => setDemoCredentials("admin")}>
                Admin
              </Button>
              <Button variant="outline" className="bg-background/50 h-10 text-xs" onClick={() => setDemoCredentials("employee")}>
                Employee
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
