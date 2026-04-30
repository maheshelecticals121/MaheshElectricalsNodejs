import * as adminUserService from "./adminUser.service.js";

/* ===============================
   GET ALL USERS or SINGLE USER (ADMIN)
   =============================== */
export const getAllUsers = async (request, reply) => {
  try {
    const payload = request.body || {};           // ← body can be empty or have user_id
    const usersData = await adminUserService.getAllUsers(payload);

    // If it's a single user (we sent user_id)
    if (payload.user_id) {
      if (!usersData) {
        return reply.status(404).send({
          success: false,
          message: "User not found",
        });
      }

      return reply.send({
        success: true,
        data: usersData,           // single object with orders array
      });
    }

    // Otherwise — list of all users
    return reply.send({
      success: true,
      totalUsers: usersData.length,
      data: usersData,             // array of users with ordersCount
    });
  } catch (err) {
    return reply.status(err.statusCode || 500).send({
      success: false,
      message: err.message || "Server error",
    });
  }
};

/* ===============================
   TOGGLE USER STATUS (unchanged)
   =============================== */
export const toggleUserStatus = async (request, reply) => {
  try {
    const { user_id, status } = request.body;

    if (!user_id || !status) {
      return reply.status(400).send({
        success: false,
        message: "user_id and status are required",
      });
    }

    const result = await adminUserService.toggleUserStatus(user_id, status);

    return reply.send({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (err) {
    return reply.status(err.statusCode || 500).send({
      success: false,
      message: err.message || "Server error",
    });
  }
};