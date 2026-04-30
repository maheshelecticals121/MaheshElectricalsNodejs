import * as adminOrderService from "./adminOrder.service.js";

/* =====================================
   ADMIN – GET ALL ORDERS
===================================== */
export async function getAllOrders(req, reply) {
  try {
    const orders = await adminOrderService.getAllOrdersService();

    return reply.send({
      success: true,
      orders,
      total: orders.length,
    });
  } catch (error) {
    return reply.code(500).send({
      success: false,
      message: error.message || "Failed to fetch orders",
    });
  }
}

/* =====================================
   ADMIN – GET ORDER DETAIL
===================================== */
export async function getOrderDetail(req, reply) {
  try {
    const { order_id } = req.body;

    if (!order_id) {
      return reply.code(400).send({
        success: false,
        message: "order_id is required",
      });
    }

    const order =
      await adminOrderService.getOrderDetailService(order_id);

    return reply.send({
      success: true,
      order,
    });
  } catch (error) {
    return reply.code(404).send({
      success: false,
      message: error.message,
    });
  }
}

/* =====================================
   ADMIN – UPDATE ORDER STATUS
   🔔 EVENT BASED (EMAIL VIA EVENTS)
===================================== */
export async function updateOrderStatus(req, reply) {
  try {
    const { order_id, order_status, tracking } = req.body;

    if (!order_id || !order_status) {
      return reply.code(400).send({
        success: false,
        message: "order_id and order_status are required",
      });
    }

    const result =
      await adminOrderService.updateOrderStatusService({
        order_id,
        order_status,
        tracking,
      });

    return reply.send({
      success: true,
      message: "Order status updated",
      ...result,
    });
  } catch (error) {
    return reply.code(400).send({
      success: false,
      message: error.message,
    });
  }
}



/* =====================================
   ADMIN – CREATE ORDER (MANUAL)
   🔥 SAME FLOW AS USER ORDER
===================================== */
export async function createAdminOrder(req, reply) {
  try {
    const order =
      await adminOrderService.createAdminOrderService(req.body);

    return reply.send({
      success: true,
      message: "Admin order created successfully",
      order_id: order.order_id,
      order,
    });
  } catch (error) {
    return reply.code(500).send({
      success: false,
      message: error.message,
    });
  }
}

export async function markOrderPaid(req, reply) {
    try {
      const { order_id } = req.body;
      if (!order_id) throw new Error("order_id required");
  
      const result =
        await adminOrderService.markOrderPaidService(order_id);
  
      return reply.send({
        success: true,
        message: "Order marked as paid",
        ...result,
      });
    } catch (err) {
      return reply.code(400).send({
        success: false,
        message: err.message,
      });
    }
  }
  