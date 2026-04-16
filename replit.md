# HRMS - Enterprise HR Management System

## Overview

A full-stack, enterprise-grade HRMS (Human Resource Management System) with separate Admin and Employee dashboards, GPS-based geo-fenced attendance, leave management, payroll, real-time insights, and AI-powered analytics.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite + Tailwind CSS v4 (dark-mode-first, glassmorphism UI)
- **UI Components**: shadcn/ui + Radix UI
- **Charts**: Recharts
- **Animations**: Framer Motion
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **State/Data fetching**: React Query
- **Routing**: Wouter
- **Auth**: Token-based (localStorage) with role-based route guards
- **Build**: esbuild (CJS bundle)

## Demo Credentials

- **Admin**: admin@hrms.com / admin123
- **Employee**: emp@hrms.com / emp123

## Features

### Admin
- Data-rich dashboard with attendance trends, payroll stats, department breakdown
- Employee management (create, edit, delete, filter)
- Live real-time attendance of all employees
- AI-powered attendance insights (late trends, absenteeism risk)
- Leave request approval/rejection workflow
- Payroll generation and management
- Department management
- Geo-fence configuration (multi-location support)
- Holiday calendar
- Reports (attendance & leave with charts)
- Notification center

### Employee
- Personal dashboard with live working hours timer
- GPS-simulated punch-in / punch-out
- Attendance history (daily/weekly/monthly)
- Leave balance tracking and application
- Payslip viewer
- Personal notifications
- Profile management

## Architecture

```
artifacts/
  api-server/           # Express 5 API backend (port 8080, serves /api)
    src/routes/         # auth, employees, attendance, leaves, payroll,
                        # departments, notifications, geofences, holidays,
                        # reports, dashboard
    src/lib/auth.ts     # Token-based auth utilities
  hrms/                 # React + Vite frontend (serves /)
    src/
      contexts/         # AuthContext (role-based auth)
      pages/admin/      # 12 admin pages
      pages/employee/   # 6 employee pages
      components/layout/ # AdminLayout, EmployeeLayout, ProtectedRoute
lib/
  api-spec/             # OpenAPI 3.1 spec (openapi.yaml)
  api-client-react/     # Generated React Query hooks (via Orval)
  api-zod/              # Generated Zod schemas (via Orval)
  db/                   # Drizzle ORM schema and DB client
    src/schema/         # employees, departments, attendance, leaves,
                        # payroll, notifications, geofences, holidays, sessions
```

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/hrms run dev` — run frontend locally

## Database Schema Tables

- `employees` — staff with roles (admin/employee/manager), salary, department
- `departments` — org structure
- `branches` — multi-location support
- `attendance` — daily punch-in/out records with GPS coordinates
- `leaves` — leave requests with type/status workflow
- `leave_balances` — per-employee yearly leave quotas
- `payroll` — monthly salary calculations
- `notifications` — per-employee notification feed
- `geofences` — office radius configurations
- `holidays` — national/optional/restricted holidays
- `sessions` — auth tokens

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
