import { Family } from "../models/Family.js";
import { Member } from "../models/Member.js";
import { passwordsMatch } from "./password.js";
import { verifySchemeOfficerLogin, listIssuedDesks } from "../services/schemeOfficerService.js";
import { SUPER_SCHEME_OFFICER_ID } from "../config.js";

export const ACCOUNTS = [
  {
    username: "registry.officer",
    password: "Reg@123",
    displayName: "Registry Officer",
    role: "REGISTRY",
    familyId: "",
    officerId: "REG-1",
    schemeId: "",
    desk: "Registry Officer"
  },
  {
    username: "scheme.creator",
    password: "Cre@123",
    displayName: "Scheme Creator",
    role: "SCHEME_CREATOR",
    familyId: "",
    officerId: "CRE-1",
    schemeId: "",
    desk: "Scheme Creator"
  },
  {
    username: "scheme.officer",
    password: "Off@123",
    displayName: "Scheme Manager",
    role: "SCHEME_OFFICER",
    familyId: "",
    officerId: SUPER_SCHEME_OFFICER_ID,
    schemeId: "",
    desk: "Scheme Manager (all schemes)"
  }
];

export const HEAD_DEMO = {
  username: "GJ-F-48291753",
  password: "Head@123",
  desk: "Family Head"
};

export function normalizeFamilyId(raw) {
  let s = String(raw || "").trim().toUpperCase();
  const withCheck = s.match(/^(GJ-F-\d{8})-\d$/);
  if (withCheck) return withCheck[1];
  return s;
}

function isFamilyId(raw) {
  return /^GJ-F-/i.test(String(raw || "").trim());
}

function sessionFromAccount(match) {
  return {
    displayName: match.displayName,
    role: match.role,
    familyId: match.familyId,
    officerId: match.officerId,
    schemeId: match.schemeId || "",
    schemeName: ""
  };
}

export async function verifyLogin(username, password) {
  const p = String(password || "");
  const raw = String(username || "").trim();

  if (isFamilyId(raw)) {
    const familyId = normalizeFamilyId(raw);
    const family = /^GJ-F-\d{8}$/.test(familyId)
      ? await Family.findOne({ familyId }).select("+passwordHash").lean()
      : null;
    const ok = await passwordsMatch(p, family?.passwordHash);
    if (!family || !ok) return null;
    const head = await Member.findOne({ memberId: family.headMemberId }).lean();
    return {
      displayName: head?.fullName || "Family Head",
      role: "HEAD",
      familyId,
      officerId: "",
      schemeId: "",
      schemeName: ""
    };
  }

  const u = raw.toLowerCase();
  const match = ACCOUNTS.find((a) => a.username === u && a.password === p);
  if (match) return sessionFromAccount(match);

  return verifySchemeOfficerLogin(u, p);
}

export async function demoAccounts() {
  const schemeDesks = await listIssuedDesks();
  return {
    stakeholders: [
      { username: HEAD_DEMO.username, password: HEAD_DEMO.password, desk: HEAD_DEMO.desk },
      ...ACCOUNTS.map((a) => ({ username: a.username, password: a.password, desk: a.desk }))
    ],
    schemeDesks: schemeDesks.map((d) => ({
      username: d.username,
      password: d.password,
      desk: d.displayName,
      schemeId: d.schemeId
    }))
  };
}
