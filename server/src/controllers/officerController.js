import { asyncHandler } from "../http.js";
import * as applicationService from "../services/applicationService.js";

export const inbox = asyncHandler(async (req, res) => {
  const rows = await applicationService.listApplications({
    status: req.query.status,
    schemeId: req.query.schemeId,
    familyId: req.query.familyId
  });
  res.json(rows);
});

export const approve = asyncHandler(async (req, res) => {
  const doc = await applicationService.decideApplication(
    req.params.id,
    "approve",
    "",
    req.actor.officerId
  );
  res.json(doc);
});

export const reject = asyncHandler(async (req, res) => {
  const doc = await applicationService.decideApplication(
    req.params.id,
    "reject",
    req.body.rejectNote,
    req.actor.officerId
  );
  res.json(doc);
});

export const beneficiaries = asyncHandler(async (req, res) => {
  const rows = await applicationService.listBeneficiaries({
    schemeId: req.query.schemeId,
    familyId: req.query.familyId
  });
  res.json(rows);
});
