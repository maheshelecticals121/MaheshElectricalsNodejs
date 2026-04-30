import { adminMiddleware } from "../../../middlewares/auth.middleware.js";
import {
  getAllUsers,
  toggleUserStatus,
} from "./adminUser.controller.js";

export default async function adminUserRoutes(app) {
  app.post(
    "/get_user_data",
    { preHandler: adminMiddleware },
    getAllUsers
  );

  app.post(
    "/user_status",
    { preHandler: adminMiddleware },
    toggleUserStatus
  );
}
