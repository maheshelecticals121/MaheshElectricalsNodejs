import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema(
  {
    order_id: {
      type: String,
      default: () => `order_${Date.now()}`,
      unique: true,
    },

    // 🔥 USER DETAILS
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String },
    address: { type: String, required: true },

    // 🔥 PRODUCT INFO
    product_id: String,
    product_title: String,
    product_price: Number,
    product_image: String,

    // 🔥 STATUS
    status: {
      type: String,
      enum: ["New", "Contacted", "Completed"],
      default: "New",
    },
  },
  { timestamps: true }
);

export const Order = mongoose.model("Order", OrderSchema);