  // order/abandoned_cart/abandonedCart.controller.js
  import {
      markAbandonedCartService,
      markAbandonedCartRemovedService,
      markAbandonedCartCheckoutService,
      getUserAbandonedCartService,
      getAllAbandonedCartsService,
      markAbandonedCartRecoveredService,
    } from "./abandonedCart.service.js";
    
    /* ===============================
      ADD (ADD TO CART)
      user_id → header
      product_id → body
    ================================ */
    export async function addAbandonedCartController(req, reply) {
      // BODY se lo (primary)
      let { user_id, product_id } = req.body || {};
    
      // 🔁 fallback (agar body empty ho)
      if (!user_id) user_id = req.headers["x-user-id"];
      if (!product_id) product_id = req.headers["x-product-id"];
    
      if (!user_id || !product_id) {
        return reply.code(400).send({
          success: false,
          message: "user_id and product_id required",
        });
      }
    
      await markAbandonedCartService({ user_id, product_id });
    
      return reply.send({ success: true });
    }
    
    
    /* ===============================
      REMOVE (REMOVE FROM CART)
    ================================ */
    export async function removeAbandonedCartController(req, reply) {
      const user_id = req.headers["x-user-id"];
      const { product_id } = req.body;
    
      await markAbandonedCartRemovedService({ user_id, product_id });
    
      return reply.send({
        success: true,
        message: "Abandoned cart removed",
      });
    }
    
    /* ===============================
      CHECKOUT (CLEAR CART)
    ================================ */
    export async function checkoutAbandonedCartController(req, reply) {
      const user_id = req.headers["x-user-id"];
    
      await markAbandonedCartCheckoutService({ user_id });
    
      return reply.send({
        success: true,
        message: "Checkout marked",
      });
    }
    
    /* ===============================
      USER – ACTIVE ABANDONED CART
      (ADMIN / SUPPORT USE)
    ================================ */
    export async function getUserAbandonedCartController(req, reply) {
      const user_id = req.headers["x-user-id"];
    
      const data = await getUserAbandonedCartService({ user_id });
    
      return reply.send({
        success: true,
        data,
      });
    }
    
    /* ===============================
      ADMIN – ALL OLD ABANDONED
    ================================ */
    export async function getAllAbandonedCartsController(req, reply) {
      const data = await getAllAbandonedCartsService({
        days: Number(req.body?.days) || null,
      });
    
      return reply.send({
        success: true,
        data,
      });
    }
    
    
    /* ===============================
      RECOVERED (AFTER EMAIL + ORDER)
    ================================ */
    export async function markRecoveredController(req, reply) {
      const { user_id } = req.body;
    
      await markAbandonedCartRecoveredService({ user_id });
    
      return reply.send({
        success: true,
        message: "Recovered carts marked",
      });
    }
    