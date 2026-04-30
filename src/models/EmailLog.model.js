import mongoose from "mongoose";

const EmailLogSchema = new mongoose.Schema(
  {
    order_id: String,
    to: String,
    type: {
      type: String,
      enum: [
        "order_placed",
        "in_production",
        "shipped",
        "delivered",
        "cancelled",
      ],
    },
    status: {
      type: String,
      enum: ["sent", "failed"],
      default: "sent",
    },
    provider: {
      type: String,
      default: "resend",
    },
    error: String,
  },
  { timestamps: true }
);

export const EmailLog = mongoose.model("EmailLog", EmailLogSchema);
