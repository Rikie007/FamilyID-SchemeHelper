import { asyncHandler } from "../http.js";
import * as schemeService from "../services/schemeService.js";

export const createScheme = asyncHandler(async (req, res) => {
  const doc = await schemeService.createScheme(req.body);
  res.status(201).json(doc);
});

export const patchScheme = asyncHandler(async (req, res) => {
  const doc = await schemeService.patchScheme(req.params.schemeId, req.body);
  res.json(doc);
});

export const listSchemes = asyncHandler(async (req, res) => {
  const rows = await schemeService.listSchemes(req.query.status);
  res.json(rows);
});
