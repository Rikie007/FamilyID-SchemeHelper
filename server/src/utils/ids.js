function randomDigits(n) {
  let s = "";
  for (let i = 0; i < n; i += 1) s += String(Math.floor(Math.random() * 10));
  return s;
}

export function newFamilyId() {
  return `GJ-F-${randomDigits(8)}`;
}

export function newMemberId() {
  return `GJ-M-${randomDigits(10)}`;
}

export function newSchemeId(domain, appliesTo) {
  const tag = String(domain || "GEN").slice(0, 4).toUpperCase();
  const kind = appliesTo === "FAMILY" ? "FAM" : "MEM";
  return `GJ-S-${tag}-${kind}-${randomDigits(4)}`;
}

export function newApplicationId() {
  return `GJ-A-${randomDigits(10)}`;
}

export function newMutationId() {
  return `GJ-X-${randomDigits(8)}`;
}

export function newOfficerId() {
  return `SO-${randomDigits(6)}`;
}

export function officerUsernameFor(schemeId) {
  return `so.${String(schemeId || "").replace(/^GJ-S-/i, "").toLowerCase()}`;
}

export function newOfficerPassword() {
  return `Off@${randomDigits(4)}`;
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}
