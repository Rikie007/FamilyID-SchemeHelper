function luhnCheckDigit(numStr) {
  let sum = 0;
  let alt = true;
  for (let i = numStr.length - 1; i >= 0; i -= 1) {
    let n = Number(numStr[i]);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return String((10 - (sum % 10)) % 10);
}

function randomDigits(n) {
  let s = "";
  for (let i = 0; i < n; i += 1) s += String(Math.floor(Math.random() * 10));
  return s;
}

export function newFamilyId() {
  const body = randomDigits(8);
  return `GJ-F-${body}-${luhnCheckDigit(body)}`;
}

export function newMemberId() {
  const body = randomDigits(10);
  return `GJ-M-${body}-${luhnCheckDigit(body)}`;
}

export function newSchemeId(domain, appliesTo) {
  const tag = String(domain || "GEN").slice(0, 4).toUpperCase();
  const kind = appliesTo === "FAMILY" ? "FAM" : "MEM";
  return `GJ-S-${tag}-${kind}-${randomDigits(4)}`;
}

export function newApplicationId() {
  const body = randomDigits(10);
  return `GJ-A-${body}-${luhnCheckDigit(body)}`;
}

export function newMutationId() {
  const body = randomDigits(8);
  return `GJ-X-${body}-${luhnCheckDigit(body)}`;
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}
