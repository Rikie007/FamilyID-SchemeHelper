import { Application, Beneficiary } from "../models/index.js";
import { ageYears } from "./people.js";

export async function alreadyReceiving(scheme, familyId, memberId) {
  const q =
    scheme.appliesTo === "FAMILY"
      ? { schemeId: scheme.schemeId, familyId, memberId: "" }
      : { schemeId: scheme.schemeId, memberId };
  return Beneficiary.exists(q);
}

export async function openApplicationExists(scheme, familyId, memberId) {
  const q =
    scheme.appliesTo === "FAMILY"
      ? { schemeId: scheme.schemeId, familyId, memberId: "", status: { $in: ["PENDING", "APPROVED"] } }
      : { schemeId: scheme.schemeId, memberId, status: { $in: ["PENDING", "APPROVED"] } };
  return Application.exists(q);
}

export function eligibilityForMember(scheme, member, asOfDate) {
  if (scheme.appliesTo === "MEMBER") {
    if (scheme.gender !== "ANY" && member.gender !== scheme.gender) {
      return { ok: false, code: "GenderMismatch" };
    }
    if (scheme.requiresWidow && member.maritalStatus !== "WIDOWED") {
      return { ok: false, code: "NotWidow" };
    }
    const age = ageYears(member.dob, asOfDate);
    if (scheme.minAge != null && age < scheme.minAge) return { ok: false, code: "AgeLow" };
    if (scheme.maxAge != null && age > scheme.maxAge) return { ok: false, code: "AgeHigh" };
  }
  return { ok: true, code: "Eligible" };
}
