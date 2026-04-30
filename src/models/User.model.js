import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    user_id: {
      type: String,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    firstName: String,
    lastName: String,
    phone: String, 
    address: String,
    city: String,
    state: String,
    pincode: String,
    country: String,
    status: {
      type: String,
      enum: ["active", "inactive", "disabled"],
      default: "active",
    },
    provider: {
      type: String,
      default: "email",
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
  },
  { timestamps: true }
);

/* =========================================
   AUTO GENERATE USER_ID (USER_1001...)
   ========================================= */
UserSchema.pre("validate", async function () {
  // already exists → skip
  if (this.user_id) return;

  const lastUser = await mongoose
    .model("User")
    .findOne({ user_id: { $regex: /^USER_\d+$/ } })
    .sort({ createdAt: -1 })
    .select("user_id")
    .lean();

  let nextNumber = 1001;

  if (lastUser?.user_id) {
    const current = parseInt(lastUser.user_id.split("_")[1], 10);
    if (!Number.isNaN(current)) {
      nextNumber = current + 1;
    }
  }

  this.user_id = `USER_${nextNumber}`;
});

export const User = mongoose.model("User", UserSchema);
