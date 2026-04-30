import { Order } from "../../../models/Order.model.js";
import { User } from "../../../models/User.model.js";
import { orderEvents, ORDER_EVENTS } from "../../order/order.events.js";

/* =====================================
   ADMIN – GET ALL ORDERS (FAST)
===================================== */
export async function getAllOrdersService() {
  return Order.find().sort({ createdAt: -1 }).lean();
}

/* =====================================
   ADMIN – GET SINGLE ORDER DETAIL
===================================== */
export async function getOrderDetailService(order_id) {
  const order = await Order.findOne({ order_id }).lean();
  if (!order) throw new Error("Order not found");
  return order;
}

/* =====================================
   ADMIN – UPDATE ORDER STATUS
   🔔 EVENT BASED
===================================== */
export async function updateOrderStatusService({
  order_id,
  order_status,
  tracking,
}) {
  const order = await Order.findOne({ order_id });
  if (!order) throw new Error("Order not found");

  if (["delivered", "cancelled"].includes(order.orderStatus)) {
    throw new Error("Final state, cannot update");
  }

  if (
    order_status === "shipped" &&
    (!tracking?.tracking_id || !tracking?.courier)
  ) {
    throw new Error("tracking_id and courier are required");
  }

  await Order.updateOne(
    { order_id },
    {
      $set: {
        orderStatus: order_status,
        ...(order_status === "shipped" && {
          tracking: {
            tracking_id: tracking.tracking_id,
            courier: tracking.courier,
            tracking_url: tracking.tracking_url || null,
            shipped_at: new Date(),
          },
        }),
      },
    }
  );

  /* 🔔 GLOBAL EVENT */
  orderEvents.emit(ORDER_EVENTS.ORDER_STATUS_UPDATED, {
    order_id,
    new_status: order_status,
  });

  return { order_id, order_status };
}



/* =====================================
   ADMIN – CREATE ORDER (MANUAL)
   🔥 SAME AS USER FLOW
===================================== */
export async function createAdminOrderService(payload) {
  const {
    user_id,
    items,
    shippingAddress,

    paymentMethod = "COD",
    paymentStatus = "paid",

    subtotal = 0,
    shippingCharge = 0,

    gift_wrap = false,
    gift_wrap_price = 0,

    totalAmount,
  } = payload;

  if (!user_id) throw new Error("user_id missing");
  if (!items || items.length === 0)
    throw new Error("Order items missing");

  const user = await User.findOne({ user_id });
  if (!user) throw new Error("User not found");

  /* =================================================
     🔥 NORMALIZE ITEMS (SAME AS FRONTEND)
  ================================================= */
  const normalizedItems = items.map((item, index) => {
    const finalImage =
      item.image_url ||
      item.design_url ||
      item.image ||
      null;

    if (!finalImage) {
      console.warn(
        `⚠️ [ADMIN ITEM ${index}] image missing for SKU ${item.qikink_sku}`
      );
    }

    return {
      ...item,

      // 🔥 REQUIRED FOR UI + EMAIL
      image_url: finalImage,

      // 🔥 POD / printing safe
      design_url: item.design_url || finalImage || null,
    };
  });

  const order = await Order.create({
    user: user._id,
    user_id: user.user_id,

    items: normalizedItems, // ✅ FIXED
    shippingAddress,

    paymentMethod,
    paymentStatus,

    subtotal,
    shippingCharge,

    gift_wrap,
    gift_wrap_price,

    totalAmount,
    orderStatus: "pending",
  });

  /* 🔔 SAME EVENT AS USER ORDER */
  orderEvents.emit(ORDER_EVENTS.ORDER_CREATED, {
    order: order.toObject(),
    userEmail:
      shippingAddress?.email ||
      user.email ||
      null,
  });

  return order;
}




export async function markOrderPaidService(order_id) {
    const order = await Order.findOne({ order_id });
    if (!order) throw new Error("Order not found");
  
    if (order.paymentStatus === "paid") {
      throw new Error("Order already paid");
    }
  
    order.paymentStatus = "paid";
    order.paid_at = new Date();
    await order.save();
  
    return {
      order_id,
      paymentStatus: "paid",
    };
  }
  
