import {
    createCODOrder,

    getAllUserOrders
  } from "./userOrder.controller.js";
  
  import { userAuthMiddleware } from "../../../middlewares/auth.middleware.js";
  
  export default async function userOrderRoutes(app) {
    app.post("/order/create-cod", { preHandler: userAuthMiddleware }, createCODOrder);
  

    app.post(
      "/order/get_all_user_orders",
      { preHandler: userAuthMiddleware },
      getAllUserOrders
    );
  }
  