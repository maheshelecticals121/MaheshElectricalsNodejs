import { Order } from "../../models/Order.model.js";
import {
  sendNewOrderAlertToAdmin,
} from "../../services/emailService.js";

/* ===============================
   CREATE ORDER
================================ */
export async function createOrder(req, reply) {
  try {
    const {
      name,
      phone,
      email,
      address,
      product,
    } = req.body;

    if (!name || !phone || !address || !product) {
      throw new Error("Required fields missing");
    }

    /* ================= SAVE ORDER ================= */
    const order = await Order.create({
      name,
      phone,
      email,
      address,

      product_id: product.product_id,
      product_title: product.title,
      product_price: product.price,
      product_image: product.mainImages?.[0],
    });

    /* ================= 🔥 EMAIL OBJECT ================= */
    const emailOrder = {
      order_id: order.order_id,

      totalAmount: product.price,

      paymentMethod: "COD",
      paymentStatus: "pending",

      shippingAddress: {
        name,
        phone,
        address,
        city: "-",   // optional
        state: "-",  // optional
        pincode: "-", // optional
      },

      items: [
        {
          title: product.title,
          price: product.price,
          quantity: 1,
          size: "-", // not needed but template expects
          image_url: product.mainImages?.[0],
        },
      ],
    };

    /* ================= 🔥 SEND ADMIN MAIL ================= */
    await sendNewOrderAlertToAdmin({
      order: emailOrder,
    });

    return reply.send({
      success: true,
      message: "Order placed successfully",
    });
  } catch (err) {
    return reply.code(400).send({
      success: false,
      message: err.message,
    });
  }
}

/* ===============================
   GET ORDERS (ADMIN)
================================ */
export async function getOrders(req, reply) {
  try {
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .lean();

    return reply.send({
      success: true,
      orders,
    });
  } catch (err) {
    return reply.code(500).send({
      success: false,
      message: err.message,
    });
  }
}

/* ===============================
   UPDATE STATUS
================================ */
export async function updateOrderStatus(req, reply) {
  try {
    const { order_id, status } = req.body;

    const order = await Order.findOne({ order_id });
    if (!order) throw new Error("Order not found");

    order.status = status;
    await order.save();

    return reply.send({
      success: true,
      order_id,
      status,
    });
  } catch (err) {
    return reply.code(400).send({
      success: false,
      message: err.message,
    });
  }
}