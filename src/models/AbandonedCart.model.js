import mongoose from "mongoose";

const abandonedCartSchema = new mongoose.Schema(
  {
    user_id: {
      type: String,
      required: true,
      index: true,
    },

    product_id: {
      type: String,
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: ["active", "removed", "checkout", "emailed", "recovered"],
      default: "active",
      index: true,
    },

    addedAt: {
      type: Date,
      default: Date.now,
    },

    removedAt: Date,
    checkoutAt: Date,
    emailedAt: Date,
    recoveredAt: Date,
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/**
 * 🚀 prevent duplicate ACTIVE cart
 */
abandonedCartSchema.index(
  { user_id: 1, product_id: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: "active" } }
);

export default mongoose.model("AbandonedCart", abandonedCartSchema);
