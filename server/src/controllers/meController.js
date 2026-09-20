import { asyncHandler, HttpError } from "../http.js";
import * as applicationService from "../services/applicationService.js";

function familyIdOf(req) {
  const id = req.actor.familyId;
  if (!id) throw new HttpError(422, "X-Family-Id required for HEAD");
  return id;
}

export const myFamily = asyncHandler(async (req, res) => {
  const dossier = await applicationService.familyDossier(familyIdOf(req), { includeHistory: false });
  res.json(dossier);
});

export const mySchemes = asyncHandler(async (req, res) => {
  const board = await applicationService.eligibilityBoard(familyIdOf(req));
  res.json(board);
});

export const apply = asyncHandler(async (req, res) => {
  const familyId = familyIdOf(req);
  const doc = await applicationService.apply(familyId, req.body, familyId);
  res.status(201).json(doc);
});

export const myApplications = asyncHandler(async (req, res) => {
  const rows = await applicationService.listApplications({ familyId: familyIdOf(req) });
  res.json(rows);
});
