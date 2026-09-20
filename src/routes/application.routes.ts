import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/rbac.middleware";
import {
  createApplication,
  getApplications,
} from "../controllers/application.controller";
import { ROLE } from "../constants/roles";

const router = Router();

router.post("/", requireAuth, requireRole(ROLE.ORG_STAFF), createApplication);
router.get(
  "/",
  requireAuth,
  requireRole(ROLE.ORG_STAFF, ROLE.CASEWORKER),
  getApplications,
);

export default router;
