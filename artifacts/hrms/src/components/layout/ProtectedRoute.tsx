import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { employee, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading) {
      if (!employee) {
        setLocation("/login");
      } else if (allowedRoles && !allowedRoles.includes(employee.role)) {
        // Redirect to their respective dashboards if role doesn't match
        if (employee.role === "admin") {
          setLocation("/admin/dashboard");
        } else {
          setLocation("/employee/dashboard");
        }
      }
    }
  }, [employee, isLoading, setLocation, allowedRoles]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!employee) return null;
  if (allowedRoles && !allowedRoles.includes(employee.role)) return null;

  return <>{children}</>;
}
