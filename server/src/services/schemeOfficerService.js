import { SchemeOfficer, Scheme } from "../models/index.js";
import { HttpError } from "../http.js";
import { hashPassword, passwordsMatch } from "../auth/password.js";
import { SUPER_SCHEME_OFFICER_ID, ROLES } from "../config.js";
import { newOfficerId, newOfficerPassword, officerUsernameFor } from "../utils/ids.js";

export function publicDesk(row) {
  return {
    officerId: row.officerId,
    username: row.username,
    password: row.issuedPassword,
    displayName: row.displayName,
    schemeId: row.schemeId
  };
}

export async function issueForScheme({ schemeId, schemeName, username, password, officerId }) {
  const issuedPassword = password || newOfficerPassword();
  const rec = await SchemeOfficer.create({
    officerId: officerId || newOfficerId(),
    username: (username || officerUsernameFor(schemeId)).toLowerCase(),
    passwordHash: await hashPassword(issuedPassword),
    issuedPassword,
    displayName: `${schemeName} officer`,
    schemeId
  });
  return publicDesk({
    officerId: rec.officerId,
    username: rec.username,
    issuedPassword,
    displayName: rec.displayName,
    schemeId: rec.schemeId
  });
}

export async function verifySchemeOfficerLogin(username, password) {
  const rec = await SchemeOfficer.findOne({ username: String(username || "").toLowerCase() })
    .select("+passwordHash")
    .lean();
  if (!rec) return null;
  const ok = await passwordsMatch(password, rec.passwordHash);
  if (!ok) return null;
  const scheme = await Scheme.findOne({ schemeId: rec.schemeId }).lean();
  return {
    displayName: rec.displayName,
    role: ROLES.SCHEME_OFFICER,
    familyId: "",
    officerId: rec.officerId,
    schemeId: rec.schemeId,
    schemeName: scheme?.name || rec.schemeId
  };
}

export async function listIssuedDesks() {
  const rows = await SchemeOfficer.find().select("+issuedPassword").sort({ username: 1 }).lean();
  return rows.map(publicDesk);
}

export async function desksBySchemeId(schemeIds) {
  const rows = await SchemeOfficer.find({ schemeId: { $in: schemeIds } })
    .select("+issuedPassword")
    .lean();
  return Object.fromEntries(rows.map((row) => [row.schemeId, publicDesk(row)]));
}

export async function schemeScopeFor(actor) {
  if (actor?.role !== ROLES.SCHEME_OFFICER) return null;
  if (actor.officerId === SUPER_SCHEME_OFFICER_ID) return "";
  const rec = await SchemeOfficer.findOne({ officerId: actor.officerId }).lean();
  if (!rec) throw new HttpError(403, "Unknown scheme officer");
  return rec.schemeId;
}
