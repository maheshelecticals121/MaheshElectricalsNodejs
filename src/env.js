import dotenv from "dotenv";

dotenv.config({
  path: new URL("../.env", import.meta.url),
});

console.log("🌱 ENV LOADED:", {
  mongo: process.env.MONGO_URI ? "OK" : "MISSING",
  cloud: process.env.CLOUDINARY_CLOUD_NAME,
  key: process.env.CLOUDINARY_API_KEY ? "OK" : "MISSING",
  secret: process.env.CLOUDINARY_API_SECRET ? "OK" : "MISSING",
});
