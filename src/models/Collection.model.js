import mongoose from "mongoose";

/* ===============================
   COLLECTION CONDITIONS
================================ */
const ConditionSchema = new mongoose.Schema(
  {
    field: {
      type: String,
      default: "tag",
    },
    operator: {
      type: String,
      default: "equals",
    },
    value: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

/* ===============================
   COLLECTION SCHEMA
================================ */
const CollectionSchema = new mongoose.Schema(
  {
    collection_id: {
      type: String,
      unique: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },

    description: {
      type: String,
      default: "",
    },

    image: {
      type: String,
      default: null,
    },

    image_version: {
      type: Number,
      default: 1,
    },

    type: {
      type: String,
      enum: ["category", "collection"],
      default: "category",
      index: true,
    },

    status: {
      type: String,
      enum: ["Active", "Draft"],
      default: "Active",
      index: true,
    },

    matchType: {
      type: String,
      enum: ["all", "any"],
      default: "any",
    },

    conditions: {
      type: [ConditionSchema],
      default: [],
    },

    product_ids: {
      type: [String],
      default: [],
      index: true,
    },

    product_count: {
      type: Number,
      default: 0,
      index: true,
    },

    seo: {
      metaTitle: { type: String, default: "" },
      metaDescription: { type: String, default: "" },
    },

    createdBy: {
      type: String,
      required: true,
      index: true,
    },

    updatedBy: {
      type: String,
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

/* ===============================
   🔥 AUTO COLLECTION_ID (FIXED)
================================ */
CollectionSchema.pre("save", async function () {
  // already generated
  if (this.collection_id) return;

  const last = await mongoose
    .model("Collection")
    .findOne({})
    .sort({ createdAt: -1 })
    .select("collection_id")
    .lean();

  const nextNumber = last?.collection_id
    ? Number(last.collection_id.split("_")[1]) + 1
    : 1001;

  this.collection_id = `COLL_${nextNumber}`;
});

/* ===============================
   🔁 AUTO IMAGE VERSION BUMP (SAFE)
================================ */
CollectionSchema.pre("findOneAndUpdate", function () {
  const update = this.getUpdate();
  if (!update) return;

  if (update.image) {
    update.image_version = Date.now();
  }

  if (update.$set?.image) {
    update.$set.image_version = Date.now();
  }
});

/* ===============================
   🚀 EXPORT
================================ */
export const Collection = mongoose.model(
  "Collection",
  CollectionSchema
);
