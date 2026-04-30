import mongoose from "mongoose";

/* ===============================
   ORDER SCHEMA
================================ */
const OrderSchema = new mongoose.Schema(
  {
    /* ===============================
       ORDER IDENTIFIER
    ================================ */
    order_id: {
      type: String,
      unique: true,
      index: true,
    },

    /* ===============================
       USER LINK
    ================================ */
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // USER_1002 (frontend / admin friendly)
    user_id: {
      type: String,
      required: true,
      index: true,
    },

    /* ===============================
       ORDER ITEMS
    ================================ */
    items: [
      {
        product_id: String,
        title: String,
        size: String,
        color: String,

        quantity: {
          type: Number,
          required: true,
        },

        price: {
          type: Number,
          required: true,
        },

        // 🔑 QIKINK SKU (MANDATORY)
        qikink_sku: {
          type: String,
          required: true,
        },

        /* ===============================
           🔥 IMAGE FIELDS (MAIN FIX)
           - image_url → email / order preview
           - design_url → POD / mockups
        ================================ */
        image_url: {
          type: String,
          default: null,
        },

        design_url: {
          type: String,
          default: null,
        },
      },
    ],

    /* ===============================
       PAYMENT
    ================================ */
    paymentMethod: {
      type: String,
      enum: ["COD", "ONLINE"],
      default: "COD",
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "refunded"],
      default: "pending",
    },

    /* ===============================
       ORDER STATUS (ADMIN CONTROLLED)
    ================================ */
    orderStatus: {
      type: String,
      enum: [
        "pending",          // order created
        "sent_to_qikink",   // pushed to qikink
        "shipped",          // tracking added
        "delivered",        // final
        "cancelled",        // final
      ],
      default: "pending",
    },

    /* ===============================
       QIKINK
    ================================ */
    qikink_order_id: {
      type: String,
      default: null,
    },

    qikink_status: {
      type: String,
      default: null,
    },

    /* ===============================
       SHIPPING / TRACKING
    ================================ */
    tracking: {
      tracking_id: { type: String, default: null },
      courier: { type: String, default: null },
      tracking_url: { type: String, default: null },
      shipped_at: { type: Date, default: null },
    },

    /* ===============================
       SHIPPING ADDRESS
    ================================ */
    shippingAddress: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      country: { type: String, default: "IN" },
    },

    /* ===============================
       AMOUNTS
    ================================ */
    subtotal: {
      type: Number,
      default: 0,
    },

    shippingCharge: {
      type: Number,
      default: 0,
    },

    totalAmount: {
      type: Number,
      required: true,
    },

    /* ===============================
       GIFT WRAP
    ================================ */
    gift_wrap: {
      type: Boolean,
      default: false,
    },

    gift_wrap_price: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

/* =========================================
   AUTO GENERATE ORDER_ID
========================================= */
OrderSchema.pre("validate", async function () {
  if (this.order_id) return;

  const BASE_ORDER_NUMBER = 233; // 👈 company already running feel

  const lastOrder = await mongoose
    .model("Order")
    .findOne({
      order_id: { $regex: /^ORD\d+$/ },
    })
    .sort({ createdAt: -1 })
    .select("order_id")
    .lean();

  let nextNumber = BASE_ORDER_NUMBER;

  if (
    lastOrder &&
    typeof lastOrder.order_id === "string" &&
    lastOrder.order_id.startsWith("ORD")
  ) {
    const numericPart = Number(lastOrder.order_id.replace("ORD", ""));
    if (!Number.isNaN(numericPart)) {
      nextNumber = numericPart + 1;
    }
  }

  // 🔢 zero padded (4 digits)
  const padded = String(nextNumber).padStart(4, "0");

  this.order_id = `ORD${padded}`;
});


export const Order = mongoose.model("Order", OrderSchema);
