import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema(
  {
    product_id: {
      type: String,
      unique: true,
      index: true,
      default: () => `prod_${Date.now()}`,
    },

    title: { type: String, required: true },

    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    description: { type: String, default: "" },

    // SEO
    pageTitle: { type: String, default: "" },
    metaDescription: { type: String, default: "" },

    price: { type: Number, default: 0 },

    // 🔥 CATEGORY (IMPORTANT)
    category: {
      type: String,
      enum: ["electrical", "furniture"],
      required: true,
    },
    subCategory: {
      type: String,
      default: "",
      trim: true,
    },
    tags: [String],

    // Images
    mainImages: [String],

    // 🔥 NO VARIANTS
    totalInventory: { type: Number, default: 0 },

    status: {
      type: String,
      enum: ["Draft", "Active"],
      default: "Active",
    },

    createdBy: String,
  },
  { timestamps: true }
);

export const Product = mongoose.model("Product", ProductSchema);