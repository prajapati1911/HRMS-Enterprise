import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { EmployeeLayout } from "@/components/layout/EmployeeLayout";

import NotFound from "@/pages/not-found";
import Login from "@/pages/login";

// Admin Pages
import AdminDashboard from "@/pages/admin/dashboard";
import AdminEmployees from "@/pages/admin/employees";
import EmployeeDetail from "@/pages/admin/employee-detail";
import AdminAttendance from "@/pages/admin/attendance";
import AdminInsights from "@/pages/admin/insights";
import AdminLeaves from "@/pages/admin/leaves";
import AdminPayroll from "@/pages/admin/payroll";
import AdminDepartments from "@/pages/admin/departments";
import AdminGeofence from "@/pages/admin/geofence";
import AdminHolidays from "@/pages/admin/holidays";
import AdminReports from "@/pages/admin/reports";
import AdminNotifications from "@/pages/admin/notifications";
import AdminReimbursements from "@/pages/admin/reimbursements";
import AdminOnDuty from "@/pages/admin/on-duty";

// Employee Pages
import EmployeeDashboard from "@/pages/employee/dashboard";
import EmployeeAttendance from "@/pages/employee/attendance";
import EmployeeLeaves from "@/pages/employee/leaves";
import EmployeePayroll from "@/pages/employee/payroll";
import EmployeeNotifications from "@/pages/employee/notifications";
import EmployeeProfile from "@/pages/employee/profile";
import EmployeeReimbursements from "@/pages/employee/reimbursements";
import EmployeeOnDuty from "@/pages/employee/on-duty";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function AdminRoutes() {
  return (
    <AdminLayout>
      <Switch>
        <Route path="/admin/dashboard" component={AdminDashboard} />
        <Route path="/admin/employees" component={AdminEmployees} />
        <Route path="/admin/employees/:id" component={EmployeeDetail} />
        <Route path="/admin/attendance" component={AdminAttendance} />
        <Route path="/admin/attendance/insights" component={AdminInsights} />
        <Route path="/admin/leaves" component={AdminLeaves} />
        <Route path="/admin/payroll" component={AdminPayroll} />
        <Route path="/admin/departments" component={AdminDepartments} />
        <Route path="/admin/geofence" component={AdminGeofence} />
        <Route path="/admin/holidays" component={AdminHolidays} />
        <Route path="/admin/reports" component={AdminReports} />
        <Route path="/admin/notifications" component={AdminNotifications} />
        <Route path="/admin/reimbursements" component={AdminReimbursements} />
        <Route path="/admin/on-duty" component={AdminOnDuty} />
        <Route><div>Admin route not found</div></Route>
      </Switch>
    </AdminLayout>
  );
}

function EmployeeRoutes() {
  return (
    <EmployeeLayout>
      <Switch>
        <Route path="/employee/dashboard" component={EmployeeDashboard} />
        <Route path="/employee/attendance" component={EmployeeAttendance} />
        <Route path="/employee/leaves" component={EmployeeLeaves} />
        <Route path="/employee/payroll" component={EmployeePayroll} />
        <Route path="/employee/reimbursements" component={EmployeeReimbursements} />
        <Route path="/employee/on-duty" component={EmployeeOnDuty} />
        <Route path="/employee/notifications" component={EmployeeNotifications} />
        <Route path="/employee/profile" component={EmployeeProfile} />
        <Route><div>Employee route not found</div></Route>
      </Switch>
    </EmployeeLayout>
  );
}

function AppRouter() {
  return (
    <Switch>
      <Route path="/login" component={Login} />

      <Route path="/admin/*">
        <ProtectedRoute allowedRoles={["admin"]}>
          <AdminRoutes />
        </ProtectedRoute>
      </Route>

      <Route path="/employee/*">
        <ProtectedRoute allowedRoles={["employee", "manager"]}>
          <EmployeeRoutes />
        </ProtectedRoute>
      </Route>

      <Route path="/">
        <Redirect to="/login" />
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <AuthProvider>
              <AppRouter />
            </AuthProvider>
          </WouterRouter>
          <Toaster position="top-right" theme="system" />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
