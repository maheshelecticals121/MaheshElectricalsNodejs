import * as adminService from "./admin.service.js";

/* ===============================
   EMAIL + PASSWORD LOGIN
================================ */
export async function login(request, reply) {
  try {
    const result = await adminService.loginAdmin(request.body);
    return reply.send({
      success: true,
      message: "Admin login successful",
      ...result,
    });
  } catch (err) {
    return reply.status(err.statusCode || 401).send({
      success: false,
      message: err.message || "Login failed",
    });
  }
}

/* ===============================
   GOOGLE LOGIN
================================ */
export async function googleLogin(request, reply) {
  try {
    const result = await adminService.loginAdminWithGoogle(request.body);
    return reply.send({
      success: true,
      message: "Google admin login successful",
      ...result,
    });
  } catch (err) {
    return reply.status(err.statusCode || 401).send({
      success: false,
      message: err.message || "Google login failed",
    });
  }
}
