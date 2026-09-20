import "./loadEnv.js";

function dbNameFromUri(uri) {
  try {
    const name = decodeURIComponent(new URL(uri).pathname.replace(/^\//, "")).split("/")[0];
    return name || "";
  } catch {
    return "";
  }
}

const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/gj_family_id";

export const config = {
  port: Number(process.env.PORT) || 4000,
  host: process.env.HOST || "0.0.0.0",
  mongoUri,
  dbName: process.env.MONGO_DB_NAME || dbNameFromUri(mongoUri) || "gj_family_id",
  corsOrigin: String(process.env.CORS_ORIGIN || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  seedReset: String(process.env.SEED_RESET || "").toLowerCase() === "true"
};

export function redactedMongoUri() {
  return String(config.mongoUri).replace(/\/\/([^:/]+):([^@]+)@/, "//$1:***@");
}

export const ROLES = Object.freeze({
  HEAD: "HEAD",
  REGISTRY: "REGISTRY",
  SCHEME_CREATOR: "SCHEME_CREATOR",
  SCHEME_OFFICER: "SCHEME_OFFICER"
});

export const SUPER_SCHEME_OFFICER_ID = "SO-1";
