// src/modules/admin/notification/adminNotification.route.js

import {
  getAdminNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
} from "./adminNotification.controller.js";

import { adminMiddleware } from "../../../middlewares/auth.middleware.js";

export default async function adminNotificationRoutes(app) {
  /* =====================================
     GET ADMIN NOTIFICATIONS
  ===================================== */
  app.post(
    "/notifications",
    { preHandler: adminMiddleware },
    getAdminNotifications
  );

  /* =====================================
     GET UNREAD COUNT
  ===================================== */
  app.post(
    "/notifications/unread-count",
    { preHandler: adminMiddleware },
    getUnreadNotificationCount
  );

  /* =====================================
     MARK AS READ
  ===================================== */
  app.post(
    "/notifications/read",
    { preHandler: adminMiddleware },
    markNotificationAsRead
  );
}
