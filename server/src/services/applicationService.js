import { Application, Beneficiary, Scheme, Family, Member, Membership } from "../models/index.js";
import { HttpError } from "../http.js";
import { newApplicationId, today } from "../utils/ids.js";
import { alreadyReceiving, openApplicationExists, eligibilityForMember } from "../domain/eligibility.js";
import { livingActiveMembers, relationToHead } from "../domain/people.js";
import { requireActiveHead } from "./registerService.js";

export async function apply(familyId, body, actorFamilyId) {
  await requireActiveHead(familyId, actorFamilyId);
  const { schemeId, memberId } = body;
  const scheme = await Scheme.findOne({ schemeId });
  if (!scheme) throw new HttpError(404, "Scheme not found");
  if (scheme.status !== "OPEN") throw new HttpError(422, "Scheme is closed");

  const asOf = today();
  if (scheme.appliesTo === "FAMILY") {
    if (await alreadyReceiving(scheme, familyId, "")) throw new HttpError(409, "AlreadyReceiving");
    if (await openApplicationExists(scheme, familyId, "")) throw new HttpError(409, "DuplicateApplication");
    const doc = await Application.create({
      applicationId: newApplicationId(),
      schemeId,
      familyId,
      memberId: "",
      status: "PENDING",
      appliedOn: asOf
    });
    return doc.toObject();
  }

  if (!memberId) throw new HttpError(422, "memberId required for MEMBER schemes");
  const seat = await Membership.findOne({ familyId, memberId, status: "ACTIVE" });
  if (!seat) throw new HttpError(422, "Member is not active in this house");
  const member = await Member.findOne({ memberId });
  if (!member || !member.isAlive) throw new HttpError(422, "Member is not living");
  if (await alreadyReceiving(scheme, familyId, memberId)) throw new HttpError(409, "AlreadyReceiving");
  if (await openApplicationExists(scheme, familyId, memberId)) throw new HttpError(409, "DuplicateApplication");
  const elig = eligibilityForMember(scheme, member, asOf);
  if (!elig.ok) throw new HttpError(422, elig.code);
  const doc = await Application.create({
    applicationId: newApplicationId(),
    schemeId,
    familyId,
    memberId,
    status: "PENDING",
    appliedOn: asOf
  });
  return doc.toObject();
}

export async function listApplications(query) {
  const q = {};
  if (query.status) q.status = query.status;
  if (query.schemeId) q.schemeId = query.schemeId;
  if (query.familyId) q.familyId = query.familyId;
  const rows = await Application.find(q).sort({ appliedOn: -1 }).lean();
  const ids = [...new Set(rows.map((r) => r.schemeId))];
  const schemes = ids.length ? await Scheme.find({ schemeId: { $in: ids } }).lean() : [];
  const names = Object.fromEntries(schemes.map((s) => [s.schemeId, s.name]));
  return rows.map((r) => ({ ...r, schemeName: names[r.schemeId] || r.schemeId }));
}

export async function decideApplication(applicationId, action, rejectNote, officerId, allowedSchemeId) {
  const app = await Application.findOne({ applicationId });
  if (!app) throw new HttpError(404, "Application not found");
  if (allowedSchemeId && app.schemeId !== allowedSchemeId) {
    throw new HttpError(403, "This desk can only decide applications for its own scheme");
  }
  if (app.status !== "PENDING") throw new HttpError(422, "Application already decided");
  const on = today();
  if (action === "approve") {
    const scheme = await Scheme.findOne({ schemeId: app.schemeId });
    if (await alreadyReceiving(scheme, app.familyId, app.memberId || "")) {
      throw new HttpError(409, "AlreadyReceiving");
    }
    app.status = "APPROVED";
    app.decidedOn = on;
    app.reviewedByOfficerId = officerId || "";
    await app.save();
    await Beneficiary.create({
      schemeId: app.schemeId,
      familyId: app.familyId,
      memberId: app.memberId || "",
      enrolledOn: on
    });
    return app.toObject();
  }
  if (action === "reject") {
    if (!rejectNote || !String(rejectNote).trim()) throw new HttpError(422, "rejectNote required");
    app.status = "REJECTED";
    app.decidedOn = on;
    app.rejectNote = String(rejectNote).trim();
    app.reviewedByOfficerId = officerId || "";
    await app.save();
    return app.toObject();
  }
  throw new HttpError(422, "action must be approve or reject");
}

export async function listBeneficiaries(query) {
  const q = {};
  if (query.schemeId) q.schemeId = query.schemeId;
  if (query.familyId) q.familyId = query.familyId;
  return Beneficiary.find(q).sort({ enrolledOn: -1 }).lean();
}

export async function familyDossier(familyId, { includeHistory = true, schemeId } = {}) {
  const family = await Family.findOne({ familyId }).lean();
  if (!family) throw new HttpError(404, "Family not found");
  const head = await Member.findOne({ memberId: family.headMemberId }).lean();
  const seatQuery = includeHistory ? { familyId } : { familyId, status: "ACTIVE" };
  const seats = await Membership.find(seatQuery).sort({ fromDate: 1 }).lean();
  const ids = [...new Set(seats.map((s) => s.memberId))];
  const people = await Member.find({ memberId: { $in: ids } }).lean();
  const byId = Object.fromEntries(people.map((p) => [p.memberId, p]));
  const members = [];
  for (const seat of seats) {
    const m = byId[seat.memberId];
    if (!includeHistory && m && !m.isAlive) continue;
    members.push({
      ...seat,
      member: m,
      relationToHead: await relationToHead(m, head)
    });
  }
  const schemeFilter = schemeId ? { familyId, schemeId } : { familyId };
  const applications = await Application.find(schemeFilter).sort({ appliedOn: -1 }).lean();
  const beneficiaries = await Beneficiary.find(schemeFilter).lean();
  return { family, head, members, applications, beneficiaries };
}

export async function searchFamilies({ familyId, memberId, name, q }) {
  const term = (q || name || "").trim();
  if (familyId || (term && term.startsWith("GJ-F-"))) {
    const id = familyId || term;
    const f = await Family.findOne({ familyId: id }).lean();
    return f ? [f] : [];
  }
  if (memberId || (term && term.startsWith("GJ-M-"))) {
    const id = memberId || term;
    const seat = await Membership.findOne({ memberId: id, status: "ACTIVE" }).lean();
    if (!seat) return [];
    const f = await Family.findOne({ familyId: seat.familyId }).lean();
    return f ? [f] : [];
  }
  if (term) {
    const people = await Member.find({ fullName: new RegExp(term, "i") }).lean();
    const out = [];
    for (const p of people) {
      const seat = await Membership.findOne({ memberId: p.memberId, status: "ACTIVE" }).lean();
      if (!seat) continue;
      const f = await Family.findOne({ familyId: seat.familyId }).lean();
      if (f && !out.find((x) => x.familyId === f.familyId)) out.push(f);
    }
    return out;
  }
  return Family.find().limit(50).lean();
}

export async function eligibilityBoard(familyId) {
  const family = await Family.findOne({ familyId }).lean();
  if (!family) throw new HttpError(404, "Family not found");
  const schemes = await Scheme.find({ status: "OPEN" }).sort({ name: 1 }).lean();
  const living = await livingActiveMembers(familyId);
  const asOf = today();
  const rows = [];
  for (const scheme of schemes) {
    if (scheme.appliesTo === "FAMILY") {
      let verdict = "Eligible";
      let note = "";
      if (await alreadyReceiving(scheme, familyId, "")) {
        verdict = "AlreadyReceiving";
        note = "Family already enrolled";
      } else if (await openApplicationExists(scheme, familyId, "")) {
        verdict = "AlreadyReceiving";
        note = "Application already open";
      }
      rows.push({ scheme, verdict, note, members: [] });
    } else {
      const members = [];
      for (const { member } of living) {
        if (await alreadyReceiving(scheme, familyId, member.memberId)) {
          members.push({ memberId: member.memberId, fullName: member.fullName, verdict: "AlreadyReceiving", note: "" });
          continue;
        }
        if (await openApplicationExists(scheme, familyId, member.memberId)) {
          members.push({ memberId: member.memberId, fullName: member.fullName, verdict: "AlreadyReceiving", note: "Application already open" });
          continue;
        }
        const elig = eligibilityForMember(scheme, member, asOf);
        members.push({
          memberId: member.memberId,
          fullName: member.fullName,
          verdict: elig.ok ? "Eligible" : "NotEligible",
          note: elig.ok ? "" : elig.code
        });
      }
      rows.push({ scheme, verdict: members.some((m) => m.verdict === "Eligible") ? "Eligible" : "NotEligible", note: "", members });
    }
  }
  return { familyId, rows };
}

export { livingActiveMembers };
