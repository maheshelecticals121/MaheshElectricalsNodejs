// src/modules/user/user.service.js

import crypto from "crypto";
import jwt from "jsonwebtoken";
import { User } from "../../models/User.model.js";
import { Otp } from "../../models/Otp.model.js";
import { sendOtpEmail } from "../../services/emailService.js";

const TOKEN_EXPIRY = "7d";
const MAX_OTP_ATTEMPTS = 3;
const OTP_EXPIRY_MINUTES = 10;

/* =====================================================
   🔑 JWT TOKEN GENERATOR (USER)
===================================================== */
function generateUserToken(user) {
  return jwt.sign(
    {
      user_id: user.user_id,
      email: user.email,
      role: user.role,
      status: user.status,
      type: "user",
    },
    process.env.USER_JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
}

/* =====================================================
   USER LOGIN / OTP FLOW
===================================================== */
export async function userLogin(body) {
  if (!process.env.USER_JWT_SECRET) {
    throw {
      statusCode: 500,
      message: "USER_JWT_SECRET not configured",
    };
  }

  const {
    email: rawEmail,
    otp: rawOtp,
    firstName: rawFirstName,
    lastName: rawLastName,
    phone: rawPhone,
  } = body || {};

  /* ================= SANITIZATION ================= */
  const email =
    typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";

  const otp =
    typeof rawOtp === "string" ? rawOtp.replace(/\D/g, "") : "";

  const firstName =
    typeof rawFirstName === "string" ? rawFirstName.trim() : "";

  const lastName =
    typeof rawLastName === "string" ? rawLastName.trim() : "";

  const phone =
    typeof rawPhone === "string" ? rawPhone.replace(/\D/g, "") : "";

  if (!email) {
    throw { statusCode: 400, message: "Email is required" };
  }

  /* =====================================================
     🟡 CASE 1: PROFILE SUBMIT (AFTER OTP VERIFIED)
  ===================================================== */
  if (!otp && (firstName || lastName || phone)) {
    let user = await User.findOne({ email });

    if (user) {
      if (user.status !== "active") {
        throw {
          statusCode: 403,
          message:
            user.status === "inactive"
              ? "Your account is inactive. Please contact support."
              : "Your account has been disabled. Contact support.",
        };
      }

      const token = generateUserToken(user);
      return { success: true, isNew: false, token, user };
    }

    if (!firstName || !lastName || phone.length !== 10) {
      throw {
        statusCode: 400,
        message: "All fields required and phone must be 10 digits",
      };
    }

    user = await User.create({
      email,
      firstName,
      lastName,
      phone,
      provider: "email",
      isEmailVerified: true,
      status: "active",
      role: "user",
    });

    const token = generateUserToken(user);
    return { success: true, isNew: true, token, user };
  }

  /* =====================================================
     🟡 CASE 2: SEND OTP
  ===================================================== */
  if (!otp) {
    const plainOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = crypto
      .createHash("sha256")
      .update(plainOtp)
      .digest("hex");

    // Remove old OTPs
    await Otp.deleteMany({ email });

    await Otp.create({
      email,
      otp_hash: otpHash,
      attempts: 0,
      expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
    });

    // 📧 Send email async (non-blocking)
    sendOtpEmail(email, plainOtp).catch((err) =>
      console.error("OTP email failed:", err)
    );

    return { success: true, message: "OTP sent successfully" };
  }

  /* =====================================================
     🔐 CASE 3: VERIFY OTP
  ===================================================== */
  if (otp.length !== 6) {
    throw { statusCode: 400, message: "OTP must be 6 digits" };
  }

  const otpRecord = await Otp.findOne({ email });

  if (!otpRecord) {
    throw { statusCode: 400, message: "OTP not found or expired" };
  }

  if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
    await Otp.deleteMany({ email });
    throw {
      statusCode: 400,
      message: "Too many invalid attempts. Please request new OTP.",
    };
  }

  const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

  if (otpHash !== otpRecord.otp_hash) {
    otpRecord.attempts += 1;
    await otpRecord.save();
    throw { statusCode: 400, message: "Invalid OTP" };
  }

  // OTP verified → cleanup
  await Otp.deleteMany({ email });

  let user = await User.findOne({ email });

  if (user) {
    if (user.status === "disabled") {
      throw { statusCode: 403, message: "Account disabled" };
    }

    user.isEmailVerified = true;
    await user.save();

    const token = generateUserToken(user);
    return { success: true, isNew: false, token, user };
  }

  // New user – profile required
  return {
    success: true,
    isNew: true,
    message: "OTP verified. Please complete your profile.",
  };
}

/* =====================================================
   GET USER PROFILE
===================================================== */
export async function getUserProfileData(body) {
  const { user_id } = body || {};
  if (!user_id) {
    throw { statusCode: 400, message: "user_id required" };
  }

  const user = await User.findOne({ user_id }).select(
    "firstName lastName email phone address city state pincode country"
  );

  if (!user) {
    throw { statusCode: 404, message: "User not found" };
  }

  return user;
}

/* =====================================================
   UPDATE USER PROFILE
===================================================== */
export async function updateUserProfileData(body) {
  const { user_id, ...updates } = body || {};
  if (!user_id) {
    throw { statusCode: 400, message: "user_id required" };
  }

  const user = await User.findOne({ user_id });
  if (!user) {
    throw { statusCode: 404, message: "User not found" };
  }

  Object.keys(updates).forEach((key) => {
    if (typeof updates[key] === "string") {
      user[key] = updates[key].trim();
    }
  });

  await user.save();
  return user;
}
