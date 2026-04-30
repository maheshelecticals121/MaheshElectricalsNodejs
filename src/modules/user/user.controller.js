// src/modules/user/user.controller.js
import * as userService from "./user.service.js";

export async function userLogin(request, reply) {
  try {
    const result = await userService.userLogin(request.body);
    return reply.send(result);
  } catch (err) {
    return reply.status(err.statusCode || 500).send({
      success: false,
      message: err.message || "Server error",
    });
  }
}

export async function getUserProfileData(request, reply) {
  try {
    const data = await userService.getUserProfileData(request.body);
    return reply.send({ success: true, data });
  } catch (err) {
    return reply.status(err.statusCode || 500).send({
      success: false,
      message: err.message || "Server error",
    });
  }
}

export async function updateUserProfileData(request, reply) {
  try {
    const data = await userService.updateUserProfileData(request.body);
    return reply.send({
      success: true,
      message: "Profile updated successfully",
      data,
    });
  } catch (err) {
    return reply.status(err.statusCode || 500).send({
      success: false,
      message: err.message || "Server error",
    });
  }
}
