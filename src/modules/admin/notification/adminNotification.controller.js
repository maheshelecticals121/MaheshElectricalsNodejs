// src/modules/admin/notification/adminNotification.controller.js

import * as notificationService from "./adminNotification.service.js";

/* =====================================
   GET ADMIN NOTIFICATIONS (LIST)
===================================== */
export async function getAdminNotifications(req, reply) {
  try {
    const limit =
      Number(req.query.limit || req.body.limit || 20);
    const skip =
      Number(req.query.skip || req.body.skip || 0);

    const notifications =
      await notificationService.getAdminNotificationsService({
        limit,
        skip,
      });

    return reply.send({
      success: true,
      notifications,
    });
  } catch (error) {
    console.error("getAdminNotifications error:", error);

    return reply.code(500).send({
      success: false,
      message: error.message || "Failed to fetch notifications",
    });
  }
}

/* =====================================
   GET UNREAD NOTIFICATION COUNT
===================================== */
export async function getUnreadNotificationCount(req, reply) {
  try {
    const count =
      await notificationService.getUnreadNotificationCountService();

    return reply.send({
      success: true,
      unreadCount: count,
    });
  } catch (error) {
    console.error("getUnreadNotificationCount error:", error);

    return reply.code(500).send({
      success: false,
      message: error.message || "Failed to fetch unread count",
    });
  }
}

/* =====================================
   MARK NOTIFICATION AS READ
===================================== */
export async function markNotificationAsRead(req, reply) {
  try {
    const { notification_id } = req.body;

    if (!notification_id) {
      return reply.code(400).send({
        success: false,
        message: "notification_id is required",
      });
    }

    const notification =
      await notificationService.markNotificationAsReadService(
        notification_id
      );

    return reply.send({
      success: true,
      notification,
    });
  } catch (error) {
    console.error("markNotificationAsRead error:", error);

    return reply.code(500).send({
      success: false,
      message: error.message,
    });
  }
}
