export const addAbandonedCartSchema = {
    body: {
      type: "object",
      required: ["user_id", "product_id"],
      properties: {
        user_id: { type: "string" },
        product_id: { type: "string" },
      },
    },
  };
  
  export const removeAbandonedCartSchema = addAbandonedCartSchema;
  
  export const checkoutAbandonedCartSchema = {
    body: {
      type: "object",
      required: ["user_id"],
      properties: {
        user_id: { type: "string" },
      },
    },
  };
  