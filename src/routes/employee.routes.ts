import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/rbac.middleware";
import {
  createEmployee,
  getEmployees,
} from "../controllers/employee.controller";
import { ROLE } from "../constants/roles";

const router = Router();

router.post("/", requireAuth, requireRole(ROLE.ORG_STAFF), createEmployee);
router.get("/", requireAuth, requireRole(ROLE.ORG_STAFF), getEmployees);

export default router;
