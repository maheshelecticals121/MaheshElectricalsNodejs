import "./env.js"; // 🔥 MUST BE FIRST LINE

import buildApp from "./app.js";
import { connectDB } from "./config/db.js";

const PORT = process.env.PORT || 5050;

async function startServer() {
  try {
    await connectDB();
    const app = await buildApp();

    await app.listen({ port: PORT, host: "0.0.0.0" });
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  } catch (err) {
    console.error("❌ Server failed:", err);
    process.exit(1);
  }
}

startServer();
