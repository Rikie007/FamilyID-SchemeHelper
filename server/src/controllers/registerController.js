import { asyncHandler } from "../http.js";
import { ROLES } from "../config.js";
import * as registerService from "../services/registerService.js";
import * as applicationService from "../services/applicationService.js";

export const createFamily = asyncHandler(async (req, res) => {
  const result = await registerService.registerFamily(req.body, req.actor.officerId);
  res.status(201).json(result);
});

export const getFamily = asyncHandler(async (req, res) => {
  const { familyId } = req.params;
  if (req.actor.role === ROLES.HEAD && req.actor.familyId !== familyId) {
    const err = new Error("HEAD may only view own family");
    err.status = 403;
    throw err;
  }
  const includeHistory = req.actor.role !== ROLES.HEAD;
  const dossier = await applicationService.familyDossier(familyId, { includeHistory });
  res.json(dossier);
});

export const lookup = asyncHandler(async (req, res) => {
  const rows = await applicationService.searchFamilies({ q: req.query.q });
  res.json(rows);
});

export const addBirth = asyncHandler(async (req, res) => {
  const result = await registerService.addBirth(req.params.familyId, req.body, req.actor.officerId);
  res.status(201).json(result);
});

export const recordMarriage = asyncHandler(async (req, res) => {
  const result = await registerService.recordMarriage(req.body, req.actor.officerId);
  res.status(201).json(result);
});

export const recordDeath = asyncHandler(async (req, res) => {
  const familyId = req.body.familyId;
  if (!familyId) {
    const err = new Error("familyId required");
    err.status = 422;
    throw err;
  }
  const result = await registerService.recordDeath(familyId, req.body, req.actor.officerId);
  res.json(result);
});
