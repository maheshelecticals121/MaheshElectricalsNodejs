import { Order } from "../../../models/Order.model.js";
import { User } from "../../../models/User.model.js";
import { orderEvents, ORDER_EVENTS } from "../order.events.js";

/* =====================================
   USER – CREATE ORDER (CHECKOUT)
   - COD + ONLINE
   - EMAIL VIA EVENTS ONLY
   - SAFE & NON-BLOCKING
===================================== */
export async function createOrderService({
  user_id,
  userEmail,

  items,
  shippingAddress,

  paymentMethod = "COD",          // COD | ONLINE
  paymentStatus = "pending",      // pending | paid | refunded

  subtotal = 0,
  shippingCharge = 0,

  gift_wrap = false,
  gift_wrap_price = 0,

  totalAmount,
}) {
  /* ================= DEBUG: RAW DATA ================= */
  console.log("🟡 [ORDER] RAW ITEMS FROM FRONTEND ↓↓↓");
  console.dir(items, { depth: null });

  console.log("🟡 [ORDER] SHIPPING ADDRESS ↓↓↓");
  console.dir(shippingAddress, { depth: null });

  /* ================= USER ================= */
  const user = await User.findOne({ user_id });
  if (!user) {
    throw new Error("User not found");
  }

  /* ================= VALIDATION ================= */
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Order items missing");
  }

  items.forEach((item, index) => {
    if (!item.qikink_sku) {
      throw new Error(`items.${index}.qikink_sku is required`);
    }

    if (!item.quantity || item.quantity <= 0) {
      throw new Error(`items.${index}.quantity invalid`);
    }

    if (!item.price || item.price <= 0) {
      throw new Error(`items.${index}.price invalid`);
    }
  });

  if (!shippingAddress?.name || !shippingAddress?.address) {
    throw new Error("Shipping address incomplete");
  }

  if (!totalAmount || totalAmount <= 0) {
    throw new Error("Total amount invalid");
  }

  /* ================= PAYMENT NOTE ================= */
  if (paymentMethod === "ONLINE" && paymentStatus !== "paid") {
    console.warn("⚠️ ONLINE order created without paid status");
  }

  /* =================================================
     🔥 NORMALIZE ITEMS (IMAGE + HARD DEBUG)
     - frontend may send: image_url | design_url | image
     - email ALWAYS reads: image_url
  ================================================= */
  const normalizedItems = items.map((item, index) => {
    console.log(`🧩 [ITEM ${index}] IMAGE DEBUG`, {
      image_url: item.image_url,
      design_url: item.design_url,
      image: item.image,
    });

    const finalImage =
      item.image_url ||
      item.design_url ||
      item.image ||
      null;

    if (!finalImage) {
      console.warn(`❌ [ITEM ${index}] IMAGE STILL MISSING`);
    } else {
      console.log(`✅ [ITEM ${index}] IMAGE FINAL →`, finalImage);
    }

    return {
      ...item,

      // 🔥 email + admin + UI
      image_url: finalImage,

      // 🔥 future POD / printing
      design_url: item.design_url || finalImage || null,
    };
  });

  console.log("🟢 [ORDER] NORMALIZED ITEMS ↓↓↓");
  console.dir(normalizedItems, { depth: null });

  /* ================= CREATE ORDER ================= */
  const order = await Order.create({
    user: user._id,
    user_id: user.user_id,

    items: normalizedItems,
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

  console.log("🟢 [ORDER] SAVED IN DB (ITEMS) ↓↓↓");
  console.dir(order.items, { depth: null });

  /* ================= GLOBAL EVENT ================= */
  const eventPayload = {
    order: order.toObject(),
    userEmail:
      userEmail ||
      shippingAddress?.email ||
      user.email ||
      null,
  };

  console.log("📨 [ORDER EVENT] PAYLOAD ↓↓↓");
  console.dir(eventPayload, { depth: null });

  orderEvents.emit(ORDER_EVENTS.ORDER_CREATED, eventPayload);

  return order;
}

/* =====================================
   USER – GET ALL ORDERS (MY ORDERS)
===================================== */
export async function getAllOrdersByUserService(user_id) {
  const user = await User.findOne({ user_id });
  if (!user) return [];

  return Order.find({ user: user._id })
    .sort({ createdAt: -1 })
    .lean();
}

/* =====================================
   USER – GET SINGLE ORDER DETAIL
===================================== */
export async function getOrderDetailByCustomerService({
  user_id,
  order_id,
}) {
  if (!order_id) {
    throw new Error("order_id missing");
  }

  const user = await User.findOne({ user_id });
  if (!user) {
    throw new Error("User not found");
  }

  const order = await Order.findOne({
    order_id,
    user: user._id,
  }).lean();

  if (!order) {
    throw new Error("Order not found");
  }

  return order;
}

/* =====================================
   USER – GET ALL ORDERS OR SINGLE ORDER
===================================== */
export async function getUserOrdersService({
  user_id,
  order_id = null,
}) {
  if (!user_id) {
    throw new Error("user_id missing");
  }

  const user = await User.findOne({ user_id });
  
  if (!user) {
    throw new Error("User not found");
  }

  // 🔹 CASE 1: SINGLE ORDER
  if (order_id) {
    const order = await Order.findOne({
      order_id,
      user: user._id,
    }).lean();

    if (!order) {
      throw new Error("Order not found");
    }

    return {
      type: "single",
      data: order,
    };
  }

  // 🔹 CASE 2: ALL ORDERS
  const orders = await Order.find({ user: user._id })
    .sort({ createdAt: -1 })
    .lean();

  return {
    type: "list",
    data: orders,
  };
}
