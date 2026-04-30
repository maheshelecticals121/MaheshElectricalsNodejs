// src/models/Otp.model.js
import mongoose from "mongoose";

const OtpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      index: true,
    },
    otp_hash: {
      type: String,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: "0s" }, // ✅ AUTO DELETE AFTER EXPIRY
    },
  },
  { timestamps: true }
);

export const Otp = mongoose.model("Otp", OtpSchema);
