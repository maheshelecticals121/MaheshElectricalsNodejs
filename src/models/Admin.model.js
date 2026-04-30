// models/Admin.model.js
import mongoose from "mongoose";

const AdminSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      default: null,
    },
    provider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    role: {
      type: String,
      enum: ["admin", "staff"],
      default: "admin",
    },
  },
  { timestamps: true }
);

export const Admin = mongoose.model("Admin", AdminSchema);
