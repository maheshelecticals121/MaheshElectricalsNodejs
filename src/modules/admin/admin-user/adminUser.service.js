import { User } from "../../../models/User.model.js";
import { Order } from "../../../models/Order.model.js";

/* ===============================
   GET ALL USERS or SINGLE USER
   =============================== */
export async function getAllUsers(payload = {}) {
  const { user_id } = payload;

  if (user_id) {
    // ── Single user ───────────────────────────────────────
    const user = await User.findOne({ user_id })
      .select(`
        user_id firstName lastName email phone
        address city state pincode country
        status role isEmailVerified createdAt
      `)
      .lean();

    if (!user) {
      throw { statusCode: 404, message: "User not found" };
    }

    const orders = await Order.find({ user_id })
      .select("order_id createdAt totalAmount status paymentStatus")
      .sort({ createdAt: -1 })
      .lean();

    return {
      ...user,
      ordersCount: orders.length,
      orders,
    };
  }

  // ── All users (with only count) ───────────────────────
  const users = await User.find({})
    .select(`
      user_id firstName lastName email phone
      address city state pincode country
      status role isEmailVerified createdAt
    `)
    .sort({ createdAt: -1 })
    .lean();

  const usersWithOrdersCount = await Promise.all(
    users.map(async (user) => {
      const ordersCount = await Order.countDocuments({ user_id: user.user_id });
      return {
        ...user,
        ordersCount,
      };
    })
  );

  return usersWithOrdersCount;
}

/* ===============================
   TOGGLE USER STATUS (unchanged)
   =============================== */
export async function toggleUserStatus(user_id, status) {
  if (!user_id || !status) {
    throw { statusCode: 400, message: "user_id and status are required" };
  }

  if (!["active", "inactive"].includes(status)) {
    throw { statusCode: 400, message: "Invalid status value" };
  }

  const user = await User.findOne({ user_id });

  if (!user) {
    throw { statusCode: 404, message: "User not found" };
  }

  user.status = status;
  await user.save();

  return {
    message: status === "active" ? "User activated successfully" : "User deactivated successfully",
    data: {
      user_id: user.user_id,
      status: user.status,
    },
  };
}