import mongoose from "mongoose";
import { config, redactedMongoUri } from "../config.js";

let connectPromise;

export async function connectDb() {
  mongoose.set("strictQuery", true);
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (!connectPromise) {
    connectPromise = mongoose
      .connect(config.mongoUri, {
        dbName: config.dbName,
        serverSelectionTimeoutMS: 20000,
        maxPoolSize: 5
      })
      .then((conn) => {
        console.log(`Mongo connected: ${redactedMongoUri()} · db ${config.dbName}`);
        return conn;
      })
      .catch((err) => {
        connectPromise = null;
        throw err;
      });
  }
  return connectPromise;
}

export async function disconnectDb() {
  await mongoose.disconnect();
}
