// src/models/Notification.model.js

import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    /* ===============================
       CORE INFO
    ================================ */
    type: {
      type: String,
      enum: [
        "ORDER_CREATED",
        "ORDER_STATUS_UPDATED",
      ],
      required: true,
    },

    title: {
      type: String,
      required: true,
    },

    message: {
      type: String,
      required: true,
    },

    /* ===============================
       RELATIONS
    ================================ */
    order_id: {
      type: String,
      index: true,
    },

    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    /* ===============================
       STATE
    ================================ */
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },

    /* ===============================
       META (FUTURE USE)
    ================================ */
    meta: {
      type: Object,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

export const Notification = mongoose.model(
  "Notification",
  NotificationSchema
);
