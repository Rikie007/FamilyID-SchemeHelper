import express from "express";
import cors from "cors";
import { errorHandler } from "./http.js";
import { config } from "./config.js";
import { connectDb } from "./db/connect.js";
import authRoutes from "./routes/auth.js";
import registerRoutes from "./routes/register.js";
import schemeRoutes from "./routes/schemes.js";
import meRoutes from "./routes/me.js";
import officerRoutes from "./routes/officer.js";

export function createApp() {
  const app = express();
  app.use(config.corsOrigin.length ? cors({ origin: config.corsOrigin }) : cors());
  app.use(express.json());
  app.use(async (_req, _res, next) => {
    try {
      await connectDb();
      next();
    } catch (err) {
      next(err);
    }
  });

  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "gj-family-id" });
  });

  app.use("/auth", authRoutes);
  app.use("/register", registerRoutes);
  app.use("/schemes", schemeRoutes);
  app.use("/me", meRoutes);
  app.use("/officer", officerRoutes);

  app.use((_req, res) => {
    res.status(404).json({ error: "Not found" });
  });
  app.use(errorHandler);
  return app;
}
