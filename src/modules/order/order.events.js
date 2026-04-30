import EventEmitter from "events";
import {Order} from "../../models/Order.model.js";
import {
  sendOrderPlacedEmailToUser,
  sendNewOrderAlertToAdmin,
  sendOrderShippedEmail,
  sendOrderDeliveredEmail,
  sendOrderCancelledEmail,
} from "../../services/emailService.js";
import { createAdminNotification } from "../../services/notification.service.js";

/**
 * 🧠 GLOBAL ORDER EVENT BUS
 */
class OrderEventBus extends EventEmitter {}

export const orderEvents = new OrderEventBus();

/* ===============================
   EVENT NAMES (LOCKED)
================================ */
export const ORDER_EVENTS = {
  ORDER_CREATED: "ORDER_CREATED",
  ORDER_STATUS_UPDATED: "ORDER_STATUS_UPDATED",
};

/* ===============================
   ORDER CREATED LISTENER
   ✅ CUSTOMER + ADMIN
================================ */
orderEvents.on(
  ORDER_EVENTS.ORDER_CREATED,
  async ({ order, userEmail }) => {
    console.log("📦 ORDER_CREATED EVENT");
    console.log("➡️ Order ID:", order?.order_id);

    /* ===============================
       📧 RESOLVE CUSTOMER EMAIL
    ================================ */
    const resolvedUserEmail =
      userEmail ||
      order?.shippingAddress?.email ||
      null;

    /* ===============================
       📧 CUSTOMER EMAIL
    ================================ */
    if (resolvedUserEmail) {
      try {
        await sendOrderPlacedEmailToUser({
          toEmail: String(resolvedUserEmail),
          order,
        });
        console.log(
          `✅ Customer mail sent → ${resolvedUserEmail}`
        );
      } catch (err) {
        console.error(
          "⚠️ Customer mail failed:",
          err.message
        );
      }
    } else {
      console.warn(
        "⚠️ Customer email missing, skipping user mail"
      );
    }

    /* ===============================
       📧 ADMIN EMAIL
    ================================ */
    try {
      await sendNewOrderAlertToAdmin({ order });
      console.log("✅ Admin mail sent");
    } catch (err) {
      console.warn(
        "⚠️ Admin mail skipped:",
        err.message
      );
    }

    /* ===============================
       🔔 ADMIN NOTIFICATION
    ================================ */
    try {
      await createAdminNotification({
        type: "ORDER_CREATED",
        title: "New order received",
        message: `Order ${order.order_id} placed`,
        order_id: order.order_id,
        user_id: order.user,
        meta: {
          totalAmount: order.totalAmount,
          itemsCount: order.items?.length || 0,
        },
      });
      console.log("✅ Admin notification created");
    } catch (err) {
      console.error(
        "⚠️ Admin notification failed:",
        err.message
      );
    }
  }
);

/* ===============================
   ORDER STATUS UPDATED
   ✅ SHIPPED / DELIVERED / CANCELLED EMAIL
================================ */
orderEvents.on(
  ORDER_EVENTS.ORDER_STATUS_UPDATED,
  async ({ order_id, new_status }) => {
    console.log("🔄 ORDER_STATUS_UPDATED EVENT");
    console.log("➡️ Order ID:", order_id);
    console.log("➡️ New Status:", new_status);

    try {
      const order = await Order.findOne({ order_id }).lean();
      if (!order) {
        console.warn("⚠️ Order not found, skipping status mail");
        return;
      }

      const resolvedUserEmail =
        order?.shippingAddress?.email || null;

      if (!resolvedUserEmail) {
        console.warn(
          "⚠️ Customer email missing, skipping status mail"
        );
        return;
      }

      if (new_status === "shipped") {
        await sendOrderShippedEmail({
          toEmail: resolvedUserEmail,
          order,
        });
        console.log("✅ Shipped mail sent");
      }

      if (new_status === "delivered") {
        await sendOrderDeliveredEmail({
          toEmail: resolvedUserEmail,
          order,
        });
        console.log("✅ Delivered mail sent");
      }

      if (new_status === "cancelled") {
        await sendOrderCancelledEmail({
          toEmail: resolvedUserEmail,
          order,
        });
        console.log("✅ Cancelled mail sent");
      }
    } catch (err) {
      console.error(
        "❌ Order status mail failed:",
        err.message
      );
    }
  }
);
