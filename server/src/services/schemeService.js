import { Scheme } from "../models/index.js";
import { HttpError } from "../http.js";
import { newSchemeId } from "../utils/ids.js";

export async function createScheme(body) {
  const { name, domain, appliesTo, minAge, maxAge, ageMin, ageMax, gender, requiresWidow } = body;
  if (!name || !domain || !appliesTo) throw new HttpError(422, "name, domain, appliesTo required");
  if (!["FAMILY", "MEMBER"].includes(appliesTo)) throw new HttpError(422, "appliesTo must be FAMILY or MEMBER");
  const schemeId = newSchemeId(domain, appliesTo);
  const doc = await Scheme.create({
    schemeId,
    name,
    domain,
    appliesTo,
    status: "OPEN",
    minAge: minAge ?? ageMin ?? null,
    maxAge: maxAge ?? ageMax ?? null,
    gender: gender || "ANY",
    requiresWidow: Boolean(requiresWidow)
  });
  return doc.toObject();
}

export async function listSchemes(status) {
  const q = status ? { status } : {};
  return Scheme.find(q).sort({ name: 1 }).lean();
}

export async function getScheme(schemeId) {
  const s = await Scheme.findOne({ schemeId }).lean();
  if (!s) throw new HttpError(404, "Scheme not found");
  return s;
}

export async function patchScheme(schemeId, body) {
  const s = await Scheme.findOne({ schemeId });
  if (!s) throw new HttpError(404, "Scheme not found");
  const allowed = ["name", "domain", "minAge", "maxAge", "gender", "requiresWidow", "status"];
  for (const key of allowed) {
    if (body[key] !== undefined) s[key] = body[key];
  }
  await s.save();
  return s.toObject();
}
