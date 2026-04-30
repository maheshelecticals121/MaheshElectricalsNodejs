import * as adminController from "./admin.controller.js";
import { adminLoginSchema } from "./admin.schema.js";

export default async function adminRoutes(app) {
  // Email + Password Login
  app.post(
    "/login",
    { schema: adminLoginSchema },
    adminController.login
  );

  // Google Admin Login
  app.post(
    "/admin/login/google",
    adminController.googleLogin
  );
}
