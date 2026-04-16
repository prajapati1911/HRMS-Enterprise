import React, { createContext, useContext, useState, useEffect } from "react";
import { Employee, LoginBody } from "@workspace/api-client-react";
import { login as loginApi } from "@workspace/api-client-react";
import { useLocation } from "wouter";

interface AuthContextType {
  employee: Employee | null;
  isLoading: boolean;
  login: (credentials: LoginBody) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const savedUser = localStorage.getItem("hrms_user");
    if (savedUser) {
      try {
        setEmployee(JSON.parse(savedUser));
      } catch (e) {
        console.error("Failed to parse user from local storage", e);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: LoginBody) => {
    const response = await loginApi(credentials);
    setEmployee(response.employee);
    localStorage.setItem("hrms_user", JSON.stringify(response.employee));
    if (response.token) {
      localStorage.setItem("hrms_token", response.token);
    }
    
    if (response.employee.role === "admin") {
      setLocation("/admin/dashboard");
    } else {
      setLocation("/employee/dashboard");
    }
  };

  const logout = () => {
    setEmployee(null);
    localStorage.removeItem("hrms_user");
    localStorage.removeItem("hrms_token");
    setLocation("/login");
  };

  return (
    <AuthContext.Provider value={{ employee, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
