import bcrypt from "bcryptjs";
import { HttpError } from "../http.js";

const COST = 12;
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", COST);

export async function hashPassword(plain) {
  const p = String(plain || "");
  if (p.length < 8) {
    throw new HttpError(422, "Password must be at least 8 characters");
  }
  return bcrypt.hash(p, COST);
}

export async function passwordsMatch(plain, storedHash) {
  const hash = storedHash && String(storedHash).startsWith("$2") ? storedHash : DUMMY_HASH;
  const ok = await bcrypt.compare(String(plain || ""), hash);
  return Boolean(storedHash && String(storedHash).startsWith("$2") && ok);
}
