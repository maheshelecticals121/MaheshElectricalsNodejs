import {
    createOrder,
    getOrders,
    updateOrderStatus,
  } from "./order.controller.js";
  
  import { adminMiddleware } from "../../middlewares/auth.middleware.js";
  
  export default async function orderRoutes(app) {
  
    console.log("✅ ORDER ROUTES REGISTERED");
  
    /* ===============================
       USER ORDER
    =============================== */
    app.post("/order/create", createOrder);
  
    /* ===============================
       ADMIN
    =============================== */
    app.post(
      "/order/list",
      { preHandler: adminMiddleware },
      getOrders
    );
  
    app.post(
      "/order/status",
      { preHandler: adminMiddleware },
      updateOrderStatus
    );
  }