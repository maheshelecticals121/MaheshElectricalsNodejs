import {
    getAllOrders,
    updateOrderStatus,
    getOrderDetail,
    createAdminOrder,
    markOrderPaid, // 🔥 NEW
  } from "./adminOrder.controller.js";
  
  import { adminMiddleware } from "../../../middlewares/auth.middleware.js";
  
  export default async function adminOrderRoutes(app) {
    /* =====================================
       ADMIN – GET ALL ORDERS
    ===================================== */
    app.post(
      "/get_all_orders",
      { preHandler: adminMiddleware },
      getAllOrders
    );
  
    /* =====================================
       ADMIN – GET ORDER DETAIL
    ===================================== */
    app.post(
      "/get_order_detail",
      { preHandler: adminMiddleware },
      getOrderDetail
    );
  
    /* =====================================
       ADMIN – UPDATE ORDER STATUS
    ===================================== */
    app.post(
      "/update_order_status",
      { preHandler: adminMiddleware },
      updateOrderStatus
    );
  
    /* =====================================
       ADMIN – MARK ORDER AS PAID (COD)
       🔥 NEW
    ===================================== */
    app.post(
      "/mark_order_paid",
      { preHandler: adminMiddleware },
      markOrderPaid
    );
  
  
  
    /* =====================================
       ADMIN – CREATE ORDER (MANUAL)
    ===================================== */
    app.post(
      "/create_order",
      { preHandler: adminMiddleware },
      createAdminOrder
    );
  }
  