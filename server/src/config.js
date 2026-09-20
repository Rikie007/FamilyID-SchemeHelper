export const config = {
  port: Number(process.env.PORT) || 4000,
  mongoUri: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/gj_family_id",
  dbName: "gj_family_id"
};

export const ROLES = Object.freeze({
  HEAD: "HEAD",
  REGISTRY: "REGISTRY",
  SCHEME_CREATOR: "SCHEME_CREATOR",
  SCHEME_OFFICER: "SCHEME_OFFICER"
});
