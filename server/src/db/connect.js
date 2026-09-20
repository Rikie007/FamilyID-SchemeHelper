import mongoose from "mongoose";
import { config, redactedMongoUri } from "../config.js";

export async function connectDb() {
  mongoose.set("strictQuery", true);
  await mongoose.connect(config.mongoUri, {
    dbName: config.dbName,
    serverSelectionTimeoutMS: 20000
  });
  console.log(`Mongo connected: ${redactedMongoUri()} · db ${config.dbName}`);
}

export async function disconnectDb() {
  await mongoose.disconnect();
}
