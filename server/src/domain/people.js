import { Member, Membership, Marriage } from "../models/index.js";

export function ageYears(dob, onDate) {
  const [y, m, d] = dob.split("-").map(Number);
  const [Y, M, D] = onDate.split("-").map(Number);
  let age = Y - y;
  if (M < m || (M === m && D < d)) age -= 1;
  return age;
}

export async function relationToHead(member, head) {
  if (!member || !head) return "";
  if (member.memberId === head.memberId) return "HEAD";
  if (head.motherMemberId === member.memberId) return "MOTHER";
  if (member.gender === "F" && member.spouseMemberId && member.spouseMemberId === head.fatherMemberId) return "MOTHER";
  if (member.spouseMemberId === head.memberId && member.gender === "F") return "WIFE";
  if (head.spouseMemberId === member.memberId && member.gender === "F") return "WIFE";
  if (member.fatherMemberId === head.memberId) {
    return member.gender === "M" ? "SON" : "DAUGHTER";
  }
  if (member.fatherMemberId && member.fatherMemberId === head.fatherMemberId && member.memberId !== head.memberId) {
    return member.gender === "M" ? "BROTHER" : "SISTER";
  }
  const father = member.fatherMemberId ? await Member.findOne({ memberId: member.fatherMemberId }).lean() : null;
  if (father && father.fatherMemberId === head.memberId) {
    return member.gender === "M" ? "GRANDSON" : "GRANDDAUGHTER";
  }
  if (member.spouseMemberId) {
    const spouse = await Member.findOne({ memberId: member.spouseMemberId }).lean();
    if (spouse && spouse.fatherMemberId === head.memberId && member.gender === "F") return "DAUGHTER_IN_LAW";
  }
  return "OTHER";
}

export async function activeMembership(memberId) {
  return Membership.findOne({ memberId, status: "ACTIVE" }).lean();
}

export async function livingActiveMembers(familyId) {
  const rows = await Membership.find({ familyId, status: "ACTIVE" }).lean();
  const ids = rows.map((r) => r.memberId);
  const people = await Member.find({ memberId: { $in: ids }, isAlive: true }).lean();
  const byId = Object.fromEntries(people.map((p) => [p.memberId, p]));
  return rows.filter((r) => byId[r.memberId]).map((r) => ({ membership: r, member: byId[r.memberId] }));
}

export async function activeMarriageOf(memberId) {
  return Marriage.findOne({
    status: "ACTIVE",
    $or: [{ husbandMemberId: memberId }, { wifeMemberId: memberId }]
  }).lean();
}
