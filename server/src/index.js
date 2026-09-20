import { config } from "./config.js";
import { connectDb } from "./db/connect.js";
import { syncAllIndexes } from "./db/syncIndexes.js";
import { createApp } from "./app.js";

await connectDb();
await syncAllIndexes();
const app = createApp();
app.listen(config.port, config.host, () => {
  console.log(`API listening on http://${config.host}:${config.port}`);
});
