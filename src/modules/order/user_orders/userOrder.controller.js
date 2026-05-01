import * as orderService from "./userOrder.service.js";

/* =====================================
   CREATE ORDER (COD)
===================================== */
export async function createCODOrder(req, reply) {
  try {
    const order = await orderService.createOrderService({
      user_id: req.user.id,
      userEmail: req.user.email,
      paymentMethod: "COD",
      paymentStatus: "pending",
      ...req.body,
    });

    return reply.send({
      success: true,
      order_id: order.order_id,
    });
  } catch (err) {
    return reply.code(400).send({
      success: false,
      message: err.message,
    });
  }
}




/* =====================================
   GET ALL USER ORDERS / SINGLE ORDER
===================================== */
/* =====================================
   GET ALL USER ORDERS / SINGLE ORDER
===================================== */
/* =====================================
   GET ALL USER ORDERS / SINGLE ORDER
===================================== */
export async function getAllUserOrders(req, reply) {
  try {
    // 🔐 AUTH CHECK
    if (!req.user) {
      return reply.code(401).send({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
    }

    // 🔥 IMPORTANT FIX
    // JWT payload me jo logical user_id hai wahi use karo
    const user_id = req.user.user_id || req.user.id;

    if (!user_id) {
      return reply.code(401).send({
        success: false,
        message: "Invalid token payload: user_id missing",
      });
    }

    const { order_id } = req.body || {};

    const result = await orderService.getUserOrdersService({
      user_id,        // ✅ CORRECT ID
      order_id: order_id || null,
    });

    return reply.send({
      success: true,
      mode: result.type, // "list" | "single"
      data: result.data,
    });

  } catch (err) {
    console.error("❌ getAllUserOrders error:", err);

    return reply.code(400).send({
      success: false,
      message: err.message || "An error occurred",
    });
  }
}
