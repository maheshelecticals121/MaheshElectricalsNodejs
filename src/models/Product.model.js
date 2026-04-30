import mongoose from "mongoose";

/* ===============================
   VARIANTS
================================ */
const SizeVariantSchema = new mongoose.Schema(
  {
    size: String,
    available: Number,
    code: String,
    sku_verified: { type: Boolean, default: false },
    sku_verified_at: { type: Date, default: null },
  },
  { _id: false }
);

const ColorVariantSchema = new mongoose.Schema(
  {
    color: String,
    images: [String], // 🔥 ADD THIS
    variants: [SizeVariantSchema],
  },
  { _id: false }
);


/* ===============================
   PRODUCT
================================ */
const ProductSchema = new mongoose.Schema(
  {
    product_id: {
      type: String,
      unique: true,
      index: true,
      default: () => `prod_${Date.now()}`,
    },

    title: { type: String, required: true },

    // ✅ SLUG (MAIN)
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    description: { type: String, default: "" },

    /* 🔥 SEO (OPTIONAL BUT READY) */
    pageTitle: { type: String, default: "" },
    metaDescription: { type: String, default: "" },

    price: { type: Number, default: 0 },
    compareAtPrice: { type: Number, default: 0 },
    costPerItem: { type: Number, default: 0 },

    status: {
      type: String,
      enum: ["Draft", "Active"],
      default: "Draft",
    },

    tags: [String],
    variants: [ColorVariantSchema],
    mainImages: [String],
    size_chart: String,
    totalInventory: Number,

    collections: [],
    createdBy: String,
  },
  { timestamps: true }
);

export const Product = mongoose.model("Product", ProductSchema);
