import { asyncHandler } from "../http.js";
import { ROLES } from "../config.js";
import * as schemeService from "../services/schemeService.js";
import { schemeScopeFor } from "../services/schemeOfficerService.js";

export const createScheme = asyncHandler(async (req, res) => {
  const doc = await schemeService.createScheme(req.body);
  res.status(201).json(doc);
});

export const patchScheme = asyncHandler(async (req, res) => {
  const doc = await schemeService.patchScheme(req.params.schemeId, req.body);
  res.json(doc);
});

export const listSchemes = asyncHandler(async (req, res) => {
  const scope = await schemeScopeFor(req.actor);
  const rows = await schemeService.listSchemes(req.query.status, {
    schemeId: scope || undefined,
    withDesk: req.actor.role === ROLES.SCHEME_CREATOR
  });
  res.json(rows);
});
