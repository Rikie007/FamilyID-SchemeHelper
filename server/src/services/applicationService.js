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
  if (query.status && query.status !== "ALL") q.status = query.status;
  if (query.schemeId) q.schemeId = query.schemeId;
  if (query.familyId) q.familyId = query.familyId;
  const rows = await Application.find(q).sort({ appliedOn: -1 }).lean();
  return decorateApplications(rows);
}

function lifecycleFor(app, enrolledOn) {
  const applied = { key: "applied", label: "Application received", at: app.appliedOn, state: "done" };
  if (app.status === "PENDING") {
    return [
      applied,
      { key: "review", label: "Under verification", at: "", state: "current" },
      { key: "decision", label: "Decision", at: "", state: "wait" },
      { key: "benefit", label: "Receiving the scheme", at: "", state: "wait" }
    ];
  }
  if (app.status === "REJECTED") {
    return [
      applied,
      { key: "review", label: "Verified", at: app.decidedOn, state: "done" },
      { key: "decision", label: "Rejected", at: app.decidedOn, state: "skip", note: app.rejectNote },
      { key: "benefit", label: "Not enrolled", at: "", state: "wait" }
    ];
  }
  return [
    applied,
    { key: "review", label: "Verified", at: app.decidedOn, state: "done" },
    { key: "decision", label: "Approved", at: app.decidedOn, state: "done" },
    {
      key: "benefit",
      label: enrolledOn ? "Receiving the scheme" : "Enrolment pending",
      at: enrolledOn || "",
      state: enrolledOn ? "done" : "current"
    }
  ];
}

async function decorateApplications(rows) {
  if (!rows.length) return [];
  const schemeIds = [...new Set(rows.map((r) => r.schemeId))];
  const familyIds = [...new Set(rows.map((r) => r.familyId))];
  const memberIds = [...new Set(rows.map((r) => r.memberId).filter(Boolean))];
  const [schemes, families, members, bens] = await Promise.all([
    Scheme.find({ schemeId: { $in: schemeIds } }).lean(),
    Family.find({ familyId: { $in: familyIds } }).lean(),
    memberIds.length ? Member.find({ memberId: { $in: memberIds } }).lean() : [],
    Beneficiary.find({
      $or: rows.map((r) => ({ schemeId: r.schemeId, familyId: r.familyId, memberId: r.memberId || "" }))
    }).lean()
  ]);
  const schemeName = Object.fromEntries(schemes.map((s) => [s.schemeId, s.name]));
  const village = Object.fromEntries(families.map((f) => [f.familyId, f.village]));
  const headIds = families.map((f) => f.headMemberId).filter(Boolean);
  const heads = headIds.length ? await Member.find({ memberId: { $in: headIds } }).lean() : [];
  const headNameById = Object.fromEntries(heads.map((h) => [h.memberId, h.fullName]));
  const headName = Object.fromEntries(families.map((f) => [f.familyId, headNameById[f.headMemberId] || ""]));
  const memberName = Object.fromEntries(members.map((m) => [m.memberId, m.fullName]));
  const enrolled = Object.fromEntries(
    bens.map((b) => [`${b.schemeId}|${b.familyId}|${b.memberId || ""}`, b.enrolledOn])
  );
  return rows.map((r) => {
    const enrolledOn = enrolled[`${r.schemeId}|${r.familyId}|${r.memberId || ""}`] || "";
    return {
      ...r,
      schemeName: schemeName[r.schemeId] || r.schemeId,
      village: village[r.familyId] || "",
      headName: headName[r.familyId] || "",
      memberName: r.memberId ? memberName[r.memberId] || r.memberId : "Whole household",
      enrolledOn,
      lifecycle: lifecycleFor(r, enrolledOn)
    };
  });
}

export async function schemeDeskOverview(schemeId) {
  const schemeQ = schemeId ? { schemeId } : {};
  const schemes = await Scheme.find(schemeQ).sort({ name: 1 }).lean();
  const ids = schemes.map((s) => s.schemeId);
  const appQ = schemeId ? { schemeId } : ids.length ? { schemeId: { $in: ids } } : { schemeId: "__none__" };
  const benQ = schemeId ? { schemeId } : ids.length ? { schemeId: { $in: ids } } : { schemeId: "__none__" };
  const [apps, bens] = await Promise.all([
    Application.find(appQ).lean(),
    Beneficiary.find(benQ).lean()
  ]);
  const rows = schemes.map((s) => {
    const sa = apps.filter((a) => a.schemeId === s.schemeId);
    const sb = bens.filter((b) => b.schemeId === s.schemeId);
    return {
      schemeId: s.schemeId,
      name: s.name,
      appliesTo: s.appliesTo,
      status: s.status,
      applications: sa.length,
      pending: sa.filter((a) => a.status === "PENDING").length,
      approved: sa.filter((a) => a.status === "APPROVED").length,
      rejected: sa.filter((a) => a.status === "REJECTED").length,
      receiving: sb.length
    };
  });
  const totals = rows.reduce(
    (acc, r) => ({
      schemes: acc.schemes + 1,
      applications: acc.applications + r.applications,
      pending: acc.pending + r.pending,
      approved: acc.approved + r.approved,
      rejected: acc.rejected + r.rejected,
      receiving: acc.receiving + r.receiving
    }),
    { schemes: 0, applications: 0, pending: 0, approved: 0, rejected: 0, receiving: 0 }
  );
  return { totals, schemes: rows };
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
  const rows = await Beneficiary.find(q).sort({ enrolledOn: -1 }).lean();
  if (!rows.length) return [];
  const schemeIds = [...new Set(rows.map((r) => r.schemeId))];
  const familyIds = [...new Set(rows.map((r) => r.familyId))];
  const memberIds = [...new Set(rows.map((r) => r.memberId).filter(Boolean))];
  const [schemes, families, members] = await Promise.all([
    Scheme.find({ schemeId: { $in: schemeIds } }).lean(),
    Family.find({ familyId: { $in: familyIds } }).lean(),
    memberIds.length ? Member.find({ memberId: { $in: memberIds } }).lean() : []
  ]);
  const schemeName = Object.fromEntries(schemes.map((s) => [s.schemeId, s.name]));
  const village = Object.fromEntries(families.map((f) => [f.familyId, f.village]));
  const memberName = Object.fromEntries(members.map((m) => [m.memberId, m.fullName]));
  const headIds = families.map((f) => f.headMemberId).filter(Boolean);
  const heads = headIds.length ? await Member.find({ memberId: { $in: headIds } }).lean() : [];
  const headById = Object.fromEntries(heads.map((h) => [h.memberId, h.fullName]));
  const headName = Object.fromEntries(families.map((f) => [f.familyId, headById[f.headMemberId] || ""]));
  return rows.map((r) => ({
    ...r,
    schemeName: schemeName[r.schemeId] || r.schemeId,
    village: village[r.familyId] || "",
    headName: headName[r.familyId] || "",
    consumerName: r.memberId ? memberName[r.memberId] || r.memberId : "Whole household"
  }));
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
  const applications = await decorateApplications(
    await Application.find(schemeFilter).sort({ appliedOn: -1 }).lean()
  );
  const beneficiaries = await listBeneficiaries(schemeFilter);
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
