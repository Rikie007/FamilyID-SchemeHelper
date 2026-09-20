import { HttpError } from "../http.js";
import { ROLES } from "../config.js";

export function requireRole(...allowed) {
  return (req, _res, next) => {
    const role = String(req.header("X-Role") || "").toUpperCase();
    req.actor = {
      role,
      familyId: req.header("X-Family-Id") || "",
      officerId: req.header("X-Officer-Id") || `${role || "OFF"}-1`
    };
    if (!allowed.includes(role) || !ROLES[role]) {
      return next(new HttpError(403, `Role ${role || "(none)"} cannot call this`));
    }
    next();
  };
}
