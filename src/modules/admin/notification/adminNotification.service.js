// src/modules/admin/notification/adminNotification.service.js

import { Notification } from "../../../models/Notification.model.js";

/* =====================================
   CREATE ADMIN NOTIFICATION
   (USED BY ORDER EVENTS)
===================================== */
export async function createAdminNotificationService({
  type,
  title,
  message,
  order_id = null,
  user_id = null,
  meta = {},
}) {
  return Notification.create({
    type,
    title,
    message,
    order_id,
    user_id,
    meta,
    isRead: false,
  });
}

/* =====================================
   GET ALL ADMIN NOTIFICATIONS
===================================== */
export async function getAdminNotificationsService({
  limit = 20,
  skip = 0,
}) {
  return Notification.find()
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
}

/* =====================================
   GET UNREAD NOTIFICATION COUNT
===================================== */
export async function getUnreadNotificationCountService() {
  return Notification.countDocuments({ isRead: false });
}

/* =====================================
   MARK NOTIFICATION AS READ
===================================== */
export async function markNotificationAsReadService(notification_id) {
  const notification = await Notification.findByIdAndUpdate(
    notification_id,
    { isRead: true },
    { new: true }
  ).lean();

  if (!notification) {
    throw new Error("Notification not found");
  }

  return notification;
}
