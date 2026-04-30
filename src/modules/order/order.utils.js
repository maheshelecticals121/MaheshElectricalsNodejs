/**
 * =================================================
 * ORDER UTILS (GLOBAL)
 * - Subtotal
 * - Shipping
 * - Gift Wrap
 * - Final Total
 * =================================================
 */

/**
 * Calculate order charges safely
 * Backend NEVER trusts frontend blindly
 */
export function calculateOrderCharges({
    items = [],
    shipping_from_front = 0,
    gift_wrap = false,
    gift_wrap_price = 0,
  }) {
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error("Order items missing for calculation");
    }
  
    /* ================= SUBTOTAL ================= */
    const subtotal = items.reduce((sum, item) => {
      if (!item.price || !item.quantity) return sum;
      return sum + Number(item.price) * Number(item.quantity);
    }, 0);
  
    /* ================= SHIPPING =================
       Rule:
       - ₹2000+ → FREE
       - else → front value (fallback 0)
    ============================================ */
    const shipping =
      subtotal >= 2000 ? 0 : Number(shipping_from_front || 0);
  
    /* ================= GIFT WRAP ================= */
    const giftWrapEnabled = Boolean(gift_wrap);
    const giftWrapPrice = giftWrapEnabled
      ? Number(gift_wrap_price || 0)
      : 0;
  
    /* ================= TOTAL ================= */
    const total =
      subtotal +
      shipping +
      giftWrapPrice;
  
    return {
      subtotal,
      shipping,
      shipping_label: shipping === 0 ? "FREE" : `₹${shipping}`,
      gift_wrap: giftWrapEnabled,
      gift_wrap_label: giftWrapEnabled ? "YES" : "NO",
      gift_wrap_price: giftWrapPrice,
      totalAmount: total,
    };
  }
  
  /**
   * Attach calculated charges to order response
   * (for GET order APIs)
   */
  export function mapOrderChargesForResponse(order) {
    return {
      subtotal: order.subtotal,
      shipping: order.shipping,
      shipping_label:
        order.shipping === 0 ? "FREE" : `₹${order.shipping}`,
      gift_wrap: order.gift_wrap,
      gift_wrap_label: order.gift_wrap ? "YES" : "NO",
      gift_wrap_price: order.gift_wrap_price || 0,
      totalAmount: order.totalAmount,
    };
  }
  