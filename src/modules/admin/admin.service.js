/**
 * 🧑‍💼 ADMIN SERVICE
 * ==================
 * - Email/Password Login
 * - Google Login
 * - Only whitelisted admins allowed
 */

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Admin } from "../../models/Admin.model.js";

/* =====================================================
   🔐 ALLOWED ADMINS (WHITELIST)
   ⚠️ Only for FIRST-TIME creation validation
===================================================== */
const ALLOWED_ADMINS = [
  {
    email: "maheshelectricalscustomer@gmail.com",
    role: "admin",
  },
];

const TOKEN_EXPIRY = "7d";

/* =====================================================
   🔑 EMAIL + PASSWORD LOGIN
===================================================== */
export async function loginAdmin({ email, password }) {
  if (!email || !password) {
    throw {
      statusCode: 400,
      message: "Email and password are required",
    };
  }

  const allowedAdmin = ALLOWED_ADMINS.find((a) => a.email === email);
  if (!allowedAdmin) {
    throw {
      statusCode: 401,
      message: "Unauthorized admin email",
    };
  }

  let admin = await Admin.findOne({ email });

  if (!admin) {
    // 👇 Fixed passwords
    let defaultPassword;

    if (email === "maheshelectricalscustomer@gmail.com") {
      defaultPassword = "Mahesh@2341";
    }


    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    admin = await Admin.create({
      email,
      password: hashedPassword,
      role: allowedAdmin.role,
      provider: "local",
    });
  }

  const isMatch = await bcrypt.compare(password, admin.password);
  if (!isMatch) {
    throw {
      statusCode: 401,
      message: "Invalid admin password",
    };
  }

  return generateAdminToken(admin);
}

/* =====================================================
   🔐 GOOGLE LOGIN
===================================================== */
export async function loginAdminWithGoogle({ email }) {
  if (!email) {
    throw {
      statusCode: 400,
      message: "Email is required",
    };
  }

  // 🔐 Check whitelist
  const allowedAdmin = ALLOWED_ADMINS.find((a) => a.email === email);
  if (!allowedAdmin) {
    throw {
      statusCode: 401,
      message:
        "Sorry, this email is not authorized as admin. Please contact support.",
    };
  }

  let admin = await Admin.findOne({ email });

  // 🧠 Auto-create on first Google login
  if (!admin) {
    admin = await Admin.create({
      email,
      provider: "google",
      role: "admin",
      isActive: true,
    });
  }

  return generateAdminToken(admin);
}

/* =====================================================
   🔑 JWT TOKEN GENERATOR (ADMIN)
===================================================== */
function generateAdminToken(admin) {
  const payload = {
    id: admin._id,
    email: admin.email,
    role: admin.role,
    type: "admin",
  };

  const token = jwt.sign(payload, process.env.ADMIN_JWT_SECRET, {
    expiresIn: TOKEN_EXPIRY,
  });

  return {
    success: true,
    token,
    admin: {
      id: admin._id,
      email: admin.email,
      role: admin.role,
    },
  };
}
