// src/config/db.js
import { MongoClient, ServerApiVersion } from "mongodb";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.MONGO_URI;

if (!uri) {
  throw new Error("❌ MONGO_URI is missing in .env file");
}

let client;
let db;
let isMongooseConnected = false;

export const connectDB = async () => {
  try {
    // 🔁 Prevent multiple connections
    if (db && isMongooseConnected) {
      console.log("⚠️ MongoDB already connected");
      return db;
    }

    if (!client) {
      client = new MongoClient(uri, {
        serverApi: {
          version: ServerApiVersion.v1,
          strict: true,
          deprecationErrors: true,
        },
      });
    }

    await client.connect();

    db = client.db(); // DB name URI se lega
    await db.command({ ping: 1 });

    if (!isMongooseConnected) {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
      });
      isMongooseConnected = true;
      console.log("✅ Mongoose connected successfully (maheshelectricals)");
    }

    console.log("✅ MongoDB Atlas connected successfully (maheshelectricals)");
    return db;
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

export const getDB = () => {
  if (!db) {
    throw new Error("❌ Database not initialized. Call connectDB first.");
  }
  return db;
};
