import { Router } from "express";
import { requireRole } from "../middleware/requireRole.js";
import { ROLES } from "../config.js";
import * as ctrl from "../controllers/officerController.js";

const router = Router();

router.get("/applications", requireRole(ROLES.SCHEME_OFFICER), ctrl.inbox);
router.post("/applications/:id/approve", requireRole(ROLES.SCHEME_OFFICER), ctrl.approve);
router.post("/applications/:id/reject", requireRole(ROLES.SCHEME_OFFICER), ctrl.reject);
router.get("/beneficiaries", requireRole(ROLES.SCHEME_OFFICER), ctrl.beneficiaries);

export default router;
