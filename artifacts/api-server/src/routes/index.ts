import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import employeesRouter from "./employees";
import attendanceRouter from "./attendance";
import leavesRouter from "./leaves";
import payrollRouter from "./payroll";
import departmentsRouter from "./departments";
import notificationsRouter from "./notifications";
import geofencesRouter from "./geofences";
import holidaysRouter from "./holidays";
import reportsRouter from "./reports";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(employeesRouter);
router.use(attendanceRouter);
router.use(leavesRouter);
router.use(payrollRouter);
router.use(departmentsRouter);
router.use(notificationsRouter);
router.use(geofencesRouter);
router.use(holidaysRouter);
router.use(reportsRouter);
router.use(dashboardRouter);

export default router;
