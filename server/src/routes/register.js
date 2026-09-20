import { Router } from "express";
import { requireRole } from "../middleware/requireRole.js";
import { ROLES } from "../config.js";
import * as ctrl from "../controllers/registerController.js";

const router = Router();

router.post("/families", requireRole(ROLES.REGISTRY), ctrl.createFamily);
router.get(
  "/families/:familyId",
  requireRole(ROLES.REGISTRY, ROLES.SCHEME_OFFICER, ROLES.HEAD),
  ctrl.getFamily
);
router.get("/lookup", requireRole(ROLES.REGISTRY, ROLES.SCHEME_OFFICER), ctrl.lookup);
router.post("/families/:familyId/births", requireRole(ROLES.REGISTRY), ctrl.addBirth);
router.post("/marriages", requireRole(ROLES.REGISTRY), ctrl.recordMarriage);
router.post("/deaths", requireRole(ROLES.REGISTRY), ctrl.recordDeath);

export default router;
