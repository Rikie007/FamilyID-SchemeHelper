import { Scheme } from "../models/index.js";
import { HttpError } from "../http.js";
import { newSchemeId } from "../utils/ids.js";
import { desksBySchemeId, issueForScheme } from "./schemeOfficerService.js";

export async function createScheme(body) {
  const { name, domain, appliesTo, minAge, maxAge, ageMin, ageMax, gender, requiresWidow, summary } = body;
  if (!name || !domain || !appliesTo) throw new HttpError(422, "name, department, and who it is for are required");
  if (!["FAMILY", "MEMBER"].includes(appliesTo)) throw new HttpError(422, "appliesTo must be FAMILY or MEMBER");
  const schemeId = newSchemeId(domain, appliesTo);
  const household = appliesTo === "FAMILY";
  const doc = await Scheme.create({
    schemeId,
    name: String(name).trim(),
    domain,
    appliesTo,
    status: "OPEN",
    minAge: household ? null : (minAge ?? ageMin ?? null),
    maxAge: household ? null : (maxAge ?? ageMax ?? null),
    gender: household ? "ANY" : gender || "ANY",
    requiresWidow: household ? false : Boolean(requiresWidow),
    summary: String(summary || "").trim()
  });
  const officer = await issueForScheme({ schemeId: doc.schemeId, schemeName: doc.name });
  return { ...doc.toObject(), officer };
}

export async function listSchemes(status, { schemeId, withDesk } = {}) {
  const q = {};
  if (status) q.status = status;
  if (schemeId) q.schemeId = schemeId;
  const rows = await Scheme.find(q).sort({ name: 1 }).lean();
  if (!withDesk) return rows;
  const desks = await desksBySchemeId(rows.map((r) => r.schemeId));
  return rows.map((r) => ({ ...r, officer: desks[r.schemeId] || null }));
}

export async function getScheme(schemeId) {
  const s = await Scheme.findOne({ schemeId }).lean();
  if (!s) throw new HttpError(404, "Scheme not found");
  return s;
}

export async function patchScheme(schemeId, body) {
  const s = await Scheme.findOne({ schemeId });
  if (!s) throw new HttpError(404, "Scheme not found");
  const allowed = ["name", "domain", "minAge", "maxAge", "gender", "requiresWidow", "status", "summary"];
  for (const key of allowed) {
    if (body[key] !== undefined) s[key] = body[key];
  }
  await s.save();
  return s.toObject();
}
