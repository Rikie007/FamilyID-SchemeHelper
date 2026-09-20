import { Router } from "express";
import { requireRole } from "../middleware/requireRole.js";
import { ROLES } from "../config.js";
import * as ctrl from "../controllers/schemeController.js";

const router = Router();

router.get(
  "/",
  requireRole(ROLES.HEAD, ROLES.REGISTRY, ROLES.SCHEME_CREATOR, ROLES.SCHEME_OFFICER),
  ctrl.listSchemes
);
router.post("/", requireRole(ROLES.SCHEME_CREATOR), ctrl.createScheme);
router.patch("/:schemeId", requireRole(ROLES.SCHEME_CREATOR), ctrl.patchScheme);

export default router;
