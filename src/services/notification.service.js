// src/services/notification.service.js

import { Notification } from "../models/Notification.model.js";

/* =====================================
   CREATE ADMIN NOTIFICATION
===================================== */
export async function createAdminNotification({
  type,
  title,
  message,
  order_id,
  user_id,
  meta = {},
}) {
  try {
    const notification = await Notification.create({
      type,
      title,
      message,
      order_id,
      user_id,
      meta,
    });

    console.log("🔔 ADMIN NOTIFICATION CREATED:", {
      type,
      order_id,
    });

    return notification;
  } catch (error) {
    console.error("❌ FAILED TO CREATE NOTIFICATION");
    console.error(error.message);

    // ❗IMPORTANT:
    // Notification failure should NEVER break order flow
    return null;
  }
}
