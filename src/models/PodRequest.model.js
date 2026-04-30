import mongoose from "mongoose";

const PodRequestSchema = new mongoose.Schema(
  {
    /* =====================
       USER
    ====================== */
    user_id: {
      type: String,
      required: true,
      index: true,
    },

    /* =====================
       PRODUCT INFO
    ====================== */
    product: {
      type: String,
      required: true,
    },

    color: {
      type: String,
      required: true,
    },

    quality: {
      type: String,
      enum: ["Standard", "Premium"],
      default: "Standard",
    },

    sides: {
      type: [String], // ["frontside", "backside"]
      required: true,
    },

    instructions: {
      type: String,
      default: "",
    },

    /* =====================
       DESIGN FILES
    ====================== */
    frontDesign: {
      type: String, // cloudinary / s3 url
      default: null,
    },

    backDesign: {
      type: String,
      default: null,
    },

    /* =====================
       STATUS
    ====================== */
    status: {
      type: String,
      enum: ["Pending", "Processing", "Done"],
      default: "Pending",
      index: true,
    },
  },
  { timestamps: true }
);

export const PodRequest = mongoose.model(
  "PodRequest",
  PodRequestSchema
);
