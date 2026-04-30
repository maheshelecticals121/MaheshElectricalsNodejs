import { Collection } from "../../models/Collection.model.js";
import { Product } from "../../models/Product.model.js";
import cloudinary from "../../config/cloudinary.js";
import { matchCollectionsByTags } from "../../services/collectionMatcher.js";
import redis from "../../config/redis.js";

/* ===============================
   ADD / UPDATE COLLECTION
================================ */
export async function addCollection(req) {
  const admin_id = req.user?.id;
  if (!admin_id) {
    throw { statusCode: 401, message: "Admin not authorized" };
  }

  let fileBuffer = null;
  const fields = {};

  /* ===============================
     READ MULTIPART DATA
  =============================== */
  for await (const part of req.parts()) {
    if (part.type === "file") {
      // ✅ Fastify gives BUFFER directly
      fileBuffer = await part.toBuffer();
    } else {
      fields[part.fieldname] = part.value;
    }
  }

  const {
    collection_id,
    title,
    slug,
    description = "",
    status = "Active",
    matchType = "any",
    conditions = "[]",
    seo = "{}",
    type = "category",
  } = fields;

  if (!title || !slug) {
    throw { statusCode: 400, message: "Title & slug required" };
  }

  let imageUrl = null;

  /* ===============================
     🔥 CLOUDINARY UPLOAD
  =============================== */
  if (fileBuffer) {
    const upload = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "maheshelectricals/collections",
          format: "webp",
          quality: "auto",
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      // ✅ CRITICAL FIX — Buffer only
      stream.end(fileBuffer);
    });

    imageUrl = upload.secure_url;
  }

  /* ===============================
     BUILD PAYLOAD
  =============================== */
  const payload = {
    title,
    slug,
    description,
    status,
    type,
    matchType,
    conditions: JSON.parse(conditions),
    seo: JSON.parse(seo),
    updatedBy: admin_id,
  };

  if (imageUrl) {
    payload.image = imageUrl;
    payload.image_version = Date.now();
  }

  /* ===============================
     🔁 UPDATE COLLECTION
  =============================== */
  if (collection_id) {
    const updated = await Collection.findOneAndUpdate(
      { collection_id },
      { $set: payload },
      { new: true }
    ).lean();

    if (!updated) {
      throw { statusCode: 404, message: "Collection not found" };
    }

    // 🔥 AUTO PRODUCT RE-SYNC
    await resyncCollectionProducts(updated);

    return updated;
  }

  /* ===============================
     🆕 CREATE COLLECTION
  =============================== */
  return Collection.create({
    ...payload,
    image: imageUrl || null,
    image_version: imageUrl ? Date.now() : 1,
    product_count: 0,
    createdBy: admin_id,
  });
}

/* ===============================
   GET COLLECTIONS
================================ */
let HOME_CACHE = {
  data: null,
  time: 0,
};
const HOME_CACHE_TTL = 30 * 1000;

export async function getCollections(req) {
  let { collection_id, type, fast } = req.body || {};

  /* ===============================
     🔹 SINGLE COLLECTION
  =============================== */
  if (collection_id) {
    const col = await Collection.findOne({ collection_id }).lean();
    if (!col) {
      throw { statusCode: 404, message: "Collection not found" };
    }

    return {
      mode: "single",
      data: formatCollection(col),
    };
  }

  /* ===============================
     🔹 BUILD QUERY
  =============================== */
  const query = {};
  if (typeof type === "string") {
    type = type.trim();
    if (type === "category" || type === "collection") {
      query.type = type;
    }
  }

  /* ===============================
     🚀 FAST MODE (REDIS)
  =============================== */
  if (fast === true) {
    const cacheKey = `HOME_COLLECTIONS_${type || "all"}`;

    const cached = await redis.get(cacheKey);
    if (cached) {
      console.log("REDIS CACHE HIT");
      return {
        mode: "list",
        data: JSON.parse(cached),
        cached: true,
      };
    }

    console.log("REDIS CACHE MISS");

    const collections = await Collection.find(
      query,
      {
        // 🔥 VERY IMPORTANT — ID + SLUG INCLUDED
        collection_id: 1,
        slug: 1,

        title: 1,
        image: 1,
        image_version: 1,
        product_count: 1,
        status: 1,
        type: 1,
        matchType: 1,
        conditions: 1,
        seo: 1,
        createdAt: 1,
        updatedAt: 1,
      }
    )
      .limit(8)
      .sort({ _id: -1 })
      .lean();

    const formatted = collections.map(formatCollection);

    await redis.set(cacheKey, JSON.stringify(formatted), "EX", 30);

    return {
      mode: "list",
      data: formatted,
    };
  }

  /* ===============================
     🔹 NORMAL MODE (ADMIN / FULL LIST)
  =============================== */
  const collections = await Collection.find(query)
    .sort({ createdAt: -1 })
    .lean();

  return {
    mode: "list",
    data: collections.map(formatCollection),
  };
}



/* ===============================
   DELETE COLLECTION
================================ */
export async function deleteCollection(req) {
  const { collection_id } = req.body;

  if (!collection_id) {
    throw { statusCode: 400, message: "collection_id required" };
  }

  await Product.updateMany(
    { "collections.collection_id": collection_id },
    { $pull: { collections: { collection_id } } }
  );

  const deleted = await Collection.findOneAndDelete({ collection_id });

  if (!deleted) {
    throw { statusCode: 404, message: "Collection not found" };
  }

  return {
    success: true,
    message: "Collection deleted successfully",
  };
}

/* ===============================
   🔥 AUTO SYNC PRODUCTS WITH COLLECTION
================================ */
async function resyncCollectionProducts(collection) {
  // 1️⃣ remove collection from all products
  await Product.updateMany(
    { "collections.collection_id": collection.collection_id },
    { $pull: { collections: { collection_id: collection.collection_id } } }
  );

  // 2️⃣ reset count
  await Collection.updateOne(
    { collection_id: collection.collection_id },
    { $set: { product_count: 0 } }
  );

  // 3️⃣ re-match active products
  const products = await Product.find({ status: "Active" });

  let count = 0;

  for (const product of products) {
    const matched = await matchCollectionsByTags(
      product.tags || [],
      [collection]
    );

    if (matched.length) {
      product.collections.push({
        collection_id: collection.collection_id,
        slug: collection.slug,
        title: collection.title,
      });

      await product.save();
      count++;
    }
  }

  // 4️⃣ update final count
  await Collection.updateOne(
    { collection_id: collection.collection_id },
    { $set: { product_count: count } }
  );
}

/* ===============================
   FORMATTER
================================ */
const CLOUDINARY_BASE =
  "https://res.cloudinary.com/ddplw7pow/image/upload";

function buildImageFull(image, version) {
  if (!image) return null;
  if (image.startsWith("http")) {
    return `${image}?v=${version || 1}`;
  }
  return `${CLOUDINARY_BASE}/${image}?v=${version || 1}`;
}

function formatCollection(c) {
  return {
    // 🔥 IDS (BACKWARD COMPATIBLE)
    collection_id: c.collection_id,
    category_id: c.collection_id,

    // 🔥 SLUGS (BACKWARD COMPATIBLE)
    slug: c.slug,
    category_slug: c.slug,

    title: c.title,
    description: c.description,
    status: c.status,
    type: c.type,
    matchType: c.matchType,
    conditions: c.conditions || [],
    product_count: c.product_count || 0,
    seo: c.seo || {},

    image: c.image,
    image_version: c.image_version,
    imageFull: buildImageFull(c.image, c.image_version),

    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}

