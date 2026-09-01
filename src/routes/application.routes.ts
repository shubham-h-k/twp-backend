import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/rbac.middleware";
import { createApplication } from "../controllers/application.controller";

const router = Router();

router.post("/", requireAuth, requireRole("org_staff"), createApplication);

export default router;
