import { Router } from "express";
import { asyncHandler, HttpError } from "../http.js";
import { demoAccounts, verifyLogin } from "../auth/accounts.js";

const router = Router();

router.get(
  "/demo-accounts",
  asyncHandler(async (_req, res) => {
    res.json(await demoAccounts());
  })
);

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const session = await verifyLogin(req.body?.username, req.body?.password);
    if (!session) throw new HttpError(401, "Invalid username or password");
    res.json(session);
  })
);

export default router;
