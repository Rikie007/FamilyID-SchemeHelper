import { Family, Member, Membership, Marriage, HeadTenure, MutationLog } from "../models/index.js";
import { HttpError } from "../http.js";
import { newFamilyId, newMemberId, newMutationId, today } from "../utils/ids.js";
import { hashPassword } from "../auth/password.js";
import { activeMembership, livingActiveMembers } from "../domain/people.js";

async function logMutation(familyId, kind, officerId, proofNote) {
  if (!proofNote || !String(proofNote).trim()) {
    throw new HttpError(422, "proofNote is required");
  }
  await MutationLog.create({
    mutationId: newMutationId(),
    familyId,
    kind,
    officerId,
    proofNote: String(proofNote).trim()
  });
}

export async function registerFamily(body, officerId) {
  const { head, village, taluka, district, foundedOn, proofNote, members, contactPhone, password } = body;
  if (!head?.fullName || !head?.gender || !head?.dob || !village || !taluka || !district) {
    throw new HttpError(422, "head, village, taluka, district required");
  }
  const passwordHash = await hashPassword(password);
  const familyId = newFamilyId();
  const memberId = newMemberId();
  const on = foundedOn || today();
  await Member.create({
    memberId,
    fullName: head.fullName,
    gender: head.gender,
    dob: head.dob,
    maritalStatus: head.maritalStatus || "UNMARRIED",
    isAlive: true
  });
  await Family.create({
    familyId,
    headMemberId: memberId,
    contactPhone: contactPhone || head.phone || "",
    village,
    taluka,
    district,
    createdOn: on,
    passwordHash
  });
  await Membership.create({
    familyId,
    memberId,
    status: "ACTIVE",
    openedHow: "FOUNDING",
    fromDate: on
  });
  await HeadTenure.create({
    familyId,
    memberId,
    startedHow: "FOUNDING",
    fromDate: on
  });

  const memberIds = { head: memberId };
  for (const extra of members || []) {
    const extraId = newMemberId();
    await Member.create({
      memberId: extraId,
      fullName: extra.fullName,
      gender: extra.gender,
      dob: extra.dob,
      maritalStatus: extra.maritalStatus || "UNMARRIED",
      fatherMemberId: extra.fatherMemberId === "HEAD" ? memberId : extra.fatherMemberId || "",
      motherMemberId: extra.motherMemberId || "",
      isAlive: true
    });
    await Membership.create({
      familyId,
      memberId: extraId,
      status: "ACTIVE",
      openedHow: extra.openedHow || "FOUNDING",
      fromDate: extra.fromDate || on
    });
    memberIds[extra.fullName] = extraId;
  }

  await logMutation(familyId, "REGISTER_FAMILY", officerId, proofNote);
  return { familyId, headMemberId: memberId, memberIds };
}

export async function addBirth(familyId, body, officerId) {
  const { fullName, gender, dob, fatherMemberId, parentMemberId, motherMemberId, proofNote, name } = body;
  const resolvedFather = fatherMemberId || parentMemberId;
  const resolvedName = fullName || name;
  if (!resolvedName || !gender || !dob || !resolvedFather) {
    throw new HttpError(422, "fullName, gender, dob, fatherMemberId required");
  }
  const family = await Family.findOne({ familyId });
  if (!family) throw new HttpError(404, "Family not found");
  const dadSeat = await Membership.findOne({ familyId, memberId: resolvedFather, status: "ACTIVE" });
  if (!dadSeat) throw new HttpError(422, "Father is not an active member of this house");
  const memberId = newMemberId();
  await Member.create({
    memberId,
    fullName: resolvedName,
    gender,
    dob,
    maritalStatus: "UNMARRIED",
    fatherMemberId: resolvedFather,
    motherMemberId: motherMemberId || (await inferMother(resolvedFather, familyId)),
    isAlive: true
  });
  await Membership.create({
    familyId,
    memberId,
    status: "ACTIVE",
    openedHow: "BIRTH",
    fromDate: dob
  });
  await logMutation(familyId, "ADD_BIRTH", officerId, proofNote);
  return { memberId };
}

export async function recordMarriage(body, officerId) {
  const {
    memberId,
    daughterMemberId,
    wifeMemberId,
    fromFamilyId,
    toFamilyId,
    spouseOfMemberId,
    husbandMemberId,
    fromDate,
    proofNote
  } = body;
  const brideId = wifeMemberId || daughterMemberId || memberId;
  const destFamilyId = toFamilyId;
  const destHusbandId = husbandMemberId || spouseOfMemberId;
  let natalFamilyId = fromFamilyId;

  if (!brideId || !destFamilyId || !destHusbandId) {
    throw new HttpError(422, "wife Member ID, toFamilyId, and husband Member ID required");
  }
  if (brideId === destHusbandId) {
    throw new HttpError(422, "Wife and husband cannot be the same member");
  }

  if (!natalFamilyId) {
    const seat = await Membership.findOne({ memberId: brideId, status: "ACTIVE" });
    if (!seat) throw new HttpError(422, "Wife is not an ACTIVE member on the register");
    natalFamilyId = seat.familyId;
  }
  if (natalFamilyId === destFamilyId) {
    throw new HttpError(422, "Wife is already ACTIVE in this house");
  }

  return marryDaughterOut(natalFamilyId, {
    daughterMemberId: brideId,
    toFamilyId: destFamilyId,
    husbandMemberId: destHusbandId,
    fromDate,
    proofNote
  }, officerId);
}

export async function marryDaughterOut(fromFamilyId, body, officerId) {
  const { daughterMemberId, toFamilyId, husbandMemberId, fromDate, proofNote } = body;
  if (!daughterMemberId || !toFamilyId || !husbandMemberId) {
    throw new HttpError(422, "daughterMemberId, toFamilyId, husbandMemberId required");
  }
  const on = fromDate || today();
  const daughter = await Member.findOne({ memberId: daughterMemberId });
  if (!daughter || daughter.gender !== "F") throw new HttpError(422, "Daughter must be female");
  const fromSeat = await Membership.findOne({ familyId: fromFamilyId, memberId: daughterMemberId, status: "ACTIVE" });
  if (!fromSeat) throw new HttpError(422, "Daughter is not active in source house");
  const dest = await Family.findOne({ familyId: toFamilyId });
  if (!dest) throw new HttpError(404, "Destination family not found");
  const husSeat = await Membership.findOne({ familyId: toFamilyId, memberId: husbandMemberId, status: "ACTIVE" });
  if (!husSeat) throw new HttpError(422, "Husband is not active in destination house");
  const husband = await Member.findOne({ memberId: husbandMemberId });
  if (!husband || husband.gender !== "M") throw new HttpError(422, "Husband must be male");
  const existing = await Marriage.findOne({ husbandMemberId, status: "ACTIVE" });
  if (existing) throw new HttpError(409, "Husband already has an active marriage (one wife)");

  fromSeat.status = "LEFT";
  fromSeat.closedHow = "MARRIAGE_OUT";
  fromSeat.toDate = on;
  await fromSeat.save();

  await Membership.create({
    familyId: toFamilyId,
    memberId: daughterMemberId,
    status: "ACTIVE",
    openedHow: "MARRIAGE_IN",
    fromDate: on
  });
  await Marriage.create({
    husbandMemberId,
    wifeMemberId: daughterMemberId,
    fromDate: on,
    status: "ACTIVE"
  });
  daughter.maritalStatus = "MARRIED";
  daughter.spouseMemberId = husbandMemberId;
  await daughter.save();
  husband.maritalStatus = "MARRIED";
  await husband.save();

  await logMutation(fromFamilyId, "MARRY_DAUGHTER_OUT", officerId, proofNote);
  await logMutation(toFamilyId, "MARRY_DAUGHTER_IN", officerId, proofNote);
  return { memberId: daughterMemberId, toFamilyId };
}

export async function recordDeath(familyId, body, officerId) {
  const { memberId, deathDate, proofNote, newHeadMemberId } = body;
  if (!memberId || !deathDate) throw new HttpError(422, "memberId and deathDate required");
  const family = await Family.findOne({ familyId });
  if (!family) throw new HttpError(404, "Family not found");
  const member = await Member.findOne({ memberId });
  if (!member) throw new HttpError(404, "Member not found");
  const seat = await Membership.findOne({ familyId, memberId, status: "ACTIVE" });
  if (!seat) throw new HttpError(422, "Member is not active in this house");

  member.isAlive = false;
  member.deathDate = deathDate;
  await member.save();
  seat.status = "LEFT";
  seat.closedHow = "DEATH";
  seat.toDate = deathDate;
  await seat.save();

  const marriage = await Marriage.findOne({
    status: "ACTIVE",
    $or: [{ husbandMemberId: memberId }, { wifeMemberId: memberId }]
  });
  if (marriage) {
    marriage.status = "ENDED";
    marriage.toDate = deathDate;
    await marriage.save();
    const otherId =
      marriage.husbandMemberId === memberId ? marriage.wifeMemberId : marriage.husbandMemberId;
    const other = await Member.findOne({ memberId: otherId });
    if (other && other.isAlive) {
      other.maritalStatus = "WIDOWED";
      await other.save();
    }
  }

  if (family.headMemberId === memberId) {
    const living = await livingActiveMembers(familyId);
    const chosen = newHeadMemberId
      ? living.map((x) => x.member).find((m) => m.memberId === newHeadMemberId)
      : pickSuccessor(living.map((x) => x.member), memberId);
    const successor = chosen;
    if (!successor) throw new HttpError(422, "No living successor for head");
    const tenure = await HeadTenure.findOne({ familyId, toDate: "" });
    if (tenure) {
      tenure.toDate = deathDate;
      await tenure.save();
    }
    await HeadTenure.create({
      familyId,
      memberId: successor.memberId,
      startedHow: "SUCCESSION_DEATH",
      fromDate: deathDate
    });
    family.headMemberId = successor.memberId;
    await family.save();
  }

  await logMutation(familyId, "RECORD_DEATH", officerId, proofNote);
  return { familyId, headMemberId: family.headMemberId };
}

async function inferMother(fatherMemberId, familyId) {
  const marriage = await Marriage.findOne({ husbandMemberId: fatherMemberId, status: "ACTIVE" });
  if (!marriage) return "";
  const seat = await Membership.findOne({
    familyId,
    memberId: marriage.wifeMemberId,
    status: "ACTIVE"
  });
  return seat ? marriage.wifeMemberId : "";
}

function pickSuccessor(living, deadId) {
  const sons = living.filter((m) => m.fatherMemberId === deadId && m.gender === "M");
  sons.sort((a, b) => a.dob.localeCompare(b.dob));
  if (sons[0]) return sons[0];
  const widow = living.find((m) => m.spouseMemberId === deadId || m.maritalStatus === "WIDOWED");
  return widow || living[0] || null;
}

export async function requireActiveHead(familyId, claimedFamilyId) {
  if (claimedFamilyId !== familyId) throw new HttpError(403, "HEAD may only act on own family");
  const family = await Family.findOne({ familyId });
  if (!family) throw new HttpError(404, "Family not found");
  const head = await Member.findOne({ memberId: family.headMemberId });
  if (!head || !head.isAlive) throw new HttpError(403, "Head is not living");
  const seat = await activeMembership(head.memberId);
  if (!seat || seat.familyId !== familyId) throw new HttpError(403, "Head is not active in this house");
  return family;
}
