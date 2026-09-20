import { Router } from "express";
import { requireRole } from "../middleware/requireRole.js";
import { ROLES } from "../config.js";
import * as ctrl from "../controllers/meController.js";

const router = Router();

router.get("/family", requireRole(ROLES.HEAD), ctrl.myFamily);
router.get("/schemes", requireRole(ROLES.HEAD), ctrl.mySchemes);
router.post("/applications", requireRole(ROLES.HEAD), ctrl.apply);
router.get("/applications", requireRole(ROLES.HEAD), ctrl.myApplications);

export default router;
