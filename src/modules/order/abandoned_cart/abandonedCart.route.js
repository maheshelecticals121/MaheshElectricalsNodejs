import { adminMiddleware } from "../../../middlewares/auth.middleware.js";

import {
  addAbandonedCartController,
  removeAbandonedCartController,
  checkoutAbandonedCartController,
  getAllAbandonedCartsController,
  markRecoveredController,
} from "./abandonedCart.controller.js";

export default async function abandonedCartRoutes(app) {
  console.log("✅ ABANDONED CART ROUTES REGISTERED");

  /* ===============================
     USER ACTIONS
     (user_id → x-user-id header)
  ================================ */

  // user added product to cart
  app.post(
    "/abandoned/add",
    addAbandonedCartController
  );

  // user removed product from cart
  app.post(
    "/abandoned/remove",
    removeAbandonedCartController
  );

  // user completed checkout
  app.post(
    "/abandoned/checkout",
    checkoutAbandonedCartController
  );

  /* ===============================
     ADMIN / SYSTEM
  ================================ */

  // admin / cron → all abandoned carts
  app.post(
    "/abandoned/admin",
    { preHandler: adminMiddleware },
    getAllAbandonedCartsController
  );

  // mark recovered after email + order
  app.post(
    "/abandoned/recovered",
    { preHandler: adminMiddleware },
    markRecoveredController
  );
}
