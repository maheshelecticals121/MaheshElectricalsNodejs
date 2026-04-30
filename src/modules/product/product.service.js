import { Product } from "../../models/Product.model.js";
import { Collection } from "../../models/Collection.model.js";
import { uploadImageBuffer } from "../../utils/uploadToCloudinary.js";
import { matchCollectionsByTags } from "../../services/collectionMatcher.js";
import redis from "../../config/redis.js";

/* ===============================
   HELPERS
================================ */
const calcInventory = (variants = []) =>
  variants.reduce(
    (sum, c) =>
      sum +
      (c.variants || []).reduce(
        (s, v) => s + Number(v.available || 0),
        0
      ),
    0
  );

function validateSkus(variants = []) {
  const skuSet = new Set();

  for (const color of variants) {
    for (const v of color.variants || []) {
      if (!v.code) {
        throw new Error(
          `SKU missing for size "${v.size}" in color "${color.color}"`
        );
      }

      if (skuSet.has(v.code)) {
        throw new Error(`Duplicate SKU detected: ${v.code}`);
      }

      skuSet.add(v.code);
    }
  }
}
async function generateUniqueSlug(baseSlug, productId = null) {
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const query = { slug };

    // 🔥 update case me current product ignore
    if (productId) {
      query.product_id = { $ne: productId };
    }

    const exists = await Product.findOne(query).lean();
    if (!exists) break;

    counter += 1;
    slug = `${baseSlug}-${counter}`;
  }

  return slug;
}

/* ===============================
   SAVE PRODUCT (CREATE / UPDATE)
================================ */
export async function saveProductService(req) {
  const fields = {};
  const mainImagesBuffers = [];
  let sizeChartBuffer = null;
  const variantImagesBuffers = {}; // {0: [], 1: [], ...} per color index

  for await (const part of req.parts()) {
    if (part.type === "file") {
      if (part.fieldname === "mainImages") {
        mainImagesBuffers.push(await part.toBuffer());
      } else if (part.fieldname === "size_chart") {
        sizeChartBuffer = await part.toBuffer();
      } else if (part.fieldname.startsWith("variantImages")) {
        const colorIndex = parseInt(part.fieldname.replace("variantImages", ""));
        if (!isNaN(colorIndex)) {
          if (!variantImagesBuffers[colorIndex]) variantImagesBuffers[colorIndex] = [];
          variantImagesBuffers[colorIndex].push(await part.toBuffer());
        }
      }
    } else {
      fields[part.fieldname] = part.value;
    }
  }

  fields._variantImagesBuffers = variantImagesBuffers; // Attach to fields for later use

  if (fields.product_id) {
    const product = await updateProduct(
      fields,
      mainImagesBuffers,
      sizeChartBuffer
    );

    return {
      mode: "update",
      product_id: product.product_id,
      product,
    };
  }

  const product = await createProduct(
    req,
    fields,
    mainImagesBuffers,
    sizeChartBuffer
  );

  return {
    mode: "create",
    product_id: product.product_id,
    product,
  };
}

/* ===============================
   GET PRODUCTS (FINAL)
================================ */
export async function getProductService(req) {
  const { product_id, fast } = req.body || {};

  /* ===============================
     🚀 SINGLE PRODUCT (PUBLIC + REDIS)
     👉 fast = true  → frontend / public
     👉 only Active products
  =============================== */
  if (product_id && fast === true) {
    const cacheKey = `PRODUCT_SINGLE_${product_id}`;

    const cached = await redis.get(cacheKey);
    if (cached) {
      return {
        mode: "single",
        product: JSON.parse(cached),
        cached: true,
      };
    }

    const product = await Product.findOne({
      product_id,
      status: "Active",
    }).lean();

    if (!product) {
      throw new Error("Product not found");
    }

    await redis.set(cacheKey, JSON.stringify(product), "EX", 30);

    return {
      mode: "single",
      product,
    };
  }

  /* ===============================
     🔹 SINGLE PRODUCT (ADMIN / EDIT)
     👉 Draft + Active both
  =============================== */
  if (product_id) {
    const product = await Product.findOne({ product_id }).lean();

    if (!product) {
      throw new Error("Product not found");
    }

    return {
      mode: "single",
      product,
    };
  }

  /* ===============================
     🚀 ALL PRODUCTS (PUBLIC + REDIS)
     👉 fast = true
     👉 only Active products
  =============================== */
  if (fast === true) {
    const cacheKey = "ALL_PRODUCTS";

    const cached = await redis.get(cacheKey);
    if (cached) {
      return {
        mode: "list",
        products: JSON.parse(cached),
        cached: true,
      };
    }

    const products = await Product.find({ status: "Active" })
      .sort({ createdAt: -1 })
      .lean();

    await redis.set(cacheKey, JSON.stringify(products), "EX", 30);

    return {
      mode: "list",
      products,
    };
  }

  /* ===============================
     🔹 ALL PRODUCTS (ADMIN)
     👉 Draft + Active
  =============================== */
  const products = await Product.find()
    .sort({ createdAt: -1 })
    .lean();

  return {
    mode: "list",
    products,
  };
}



/* ===============================
   CREATE PRODUCT
================================ */
async function createProduct(req, fields, imageBuffers, sizeChartBuffer) {
  const adminId = req.user?.id;
  if (!adminId) throw new Error("Unauthorized");

  if (!fields.slug) {
    throw new Error("slug is required");
  }

  const variants = JSON.parse(fields.variants || "[]");
  const tags = JSON.parse(fields.tags || "[]");

  validateSkus(variants);

  // 🔥 AUTO UNIQUE SLUG (NO ERROR)
  const finalSlug = await generateUniqueSlug(fields.slug);

  /* ===============================
     MAIN IMAGES
  =============================== */
  const uploadedMainImages = await Promise.all(
    imageBuffers.map(b => uploadImageBuffer(b, "maheshelectricals/products"))
  );

  let finalMainImages = uploadedMainImages;

  if (fields.mainImagesOrder) {
    const order = JSON.parse(fields.mainImagesOrder);
    finalMainImages = [];
    order.forEach((item) => {
      if (item.startsWith("new:")) {
        const idx = parseInt(item.split(":")[1]);
        if (!isNaN(idx) && uploadedMainImages[idx]) {
          finalMainImages.push(uploadedMainImages[idx]);
        }
      } else {
        finalMainImages.push(item);
      }
    });
  }

  /* ===============================
     VARIANT IMAGES
  =============================== */
  const uploadTasks = [];
  variants.forEach((v, idx) => {
    const buffers = fields._variantImagesBuffers?.[idx] || [];
    if (buffers.length) {
      uploadTasks.push(
        Promise.all(
          buffers.map(b => uploadImageBuffer(b, "maheshelectricals/products"))
        ).then((urls) => {
          // Combine with existing or ordered
          let finalVariantImages = urls;
          if (v.images && Array.isArray(v.images)) {
            finalVariantImages = [];
            v.images.forEach((item) => {
              if (item.startsWith("new:")) {
                const fileIdx = parseInt(item.split(":")[1]);
                if (!isNaN(fileIdx) && urls[fileIdx]) {
                  finalVariantImages.push(urls[fileIdx]);
                }
              } else {
                finalVariantImages.push(item);
              }
            });
          }
          v.images = finalVariantImages;
        })
      );
    } else if (v.images && Array.isArray(v.images)) {
      // If no new, but order sent (for reordering existing), use as is
      v.images = v.images.filter(item => !item.startsWith("new:"));
    } else {
      v.images = [];
    }
  });
  await Promise.all(uploadTasks);

  /* ===============================
     SIZE CHART
  =============================== */
  let sizeChartUrl = null;
  if (sizeChartBuffer) {
    sizeChartUrl = await uploadImageBuffer(
      sizeChartBuffer,
      "maheshelectricals/size-charts"
    );
  }

  /* ===============================
     CREATE PRODUCT
  =============================== */
  const product = await Product.create({
    title: fields.title,
    slug: finalSlug, // 🔥 IMPORTANT

    description: fields.description,

    pageTitle: fields.pageTitle || fields.title,
    metaDescription: fields.metaDescription || "",

    price: Number(fields.price || 0),
    compareAtPrice: Number(fields.compareAtPrice || 0),
    costPerItem: Number(fields.costPerItem || 0),

    tags,
    variants,
    mainImages: finalMainImages,
    size_chart: sizeChartUrl,
    totalInventory: calcInventory(variants),

    status: "Active",
    collections: [],
    createdBy: adminId,
  });

  /* ===============================
     COLLECTION MATCH
  =============================== */
  const matched = await matchCollectionsByTags(tags);
  if (matched.length) {
    product.collections = matched;
    await product.save();

    await Promise.all(
      matched.map(c =>
        Collection.updateOne(
          { collection_id: c.collection_id },
          { $inc: { product_count: 1 } }
        )
      )
    );
  }

  await invalidateProductCaches(
    product.product_id,
    matched.map(c => c.slug)
  );

  return product;
}


/* ===============================
   UPDATE PRODUCT (SINGLE SOURCE OF TRUTH)
================================ */
async function updateProduct(fields, imageBuffers, sizeChartBuffer) {
  const product = await Product.findOne({ product_id: fields.product_id });
  if (!product) throw new Error("Product not found");

  const oldTags = [...(product.tags || [])];
  const oldCollections = [...(product.collections || [])];
  const wasActive = product.status === "Active";

  // ────────────────────────────────────────────────
  //     YE DO LINES MISSING THI – AB ADD KAR DO
  if (fields.title !== undefined) {
    product.title = fields.title.trim();   // trim karna safe hai
  }
  if (fields.description !== undefined) {
    product.description = fields.description;
  }
  // ────────────────────────────────────────────────

  // SLUG handling (pehla tha – same rakh sakte ho)
  if (fields.slug && fields.slug !== product.slug) {
    product.slug = await generateUniqueSlug(
      fields.slug,
      product.product_id
    );
  }

  // SEO fields (pehla tha – same)
  if (fields.pageTitle !== undefined) product.pageTitle = fields.pageTitle;
  if (fields.metaDescription !== undefined) {
    product.metaDescription = fields.metaDescription;
  }

  if (fields.tags !== undefined) {
    product.tags = JSON.parse(fields.tags || "[]");
  }

  if (fields.price !== undefined) product.price = Number(fields.price);
  if (fields.compareAtPrice !== undefined) {
    product.compareAtPrice = Number(fields.compareAtPrice);
  }

  // Main Images handling (same rahega)
  const uploadedMainImages = await Promise.all(
    imageBuffers.map(b => uploadImageBuffer(b, "maheshelectricals/products"))
  );

  let finalMainImages = product.mainImages || [];

  if (fields.mainImagesOrder) {
    const order = JSON.parse(fields.mainImagesOrder);
    finalMainImages = [];
    order.forEach((item) => {
      if (item.startsWith("new:")) {
        const idx = parseInt(item.split(":")[1]);
        if (!isNaN(idx) && uploadedMainImages[idx]) {
          finalMainImages.push(uploadedMainImages[idx]);
        }
      } else {
        if (product.mainImages.includes(item)) {
          finalMainImages.push(item);
        }
      }
    });
  } else if (uploadedMainImages.length) {
    finalMainImages.push(...uploadedMainImages);
  }
  product.mainImages = finalMainImages;

  // Size chart (same)
  if (sizeChartBuffer) {
    product.size_chart = await uploadImageBuffer(
      sizeChartBuffer,
      "maheshelectricals/size-charts"
    );
  }

  // Variants handling (same – yeh already sahi chal raha tha)
  if (fields.variants !== undefined) {
    const variants = JSON.parse(fields.variants);
    const uploadTasks = [];

    variants.forEach((v, idx) => {
      const buffers = fields._variantImagesBuffers?.[idx] || [];

      if (buffers.length) {
        uploadTasks.push(
          Promise.all(
            buffers.map(b => uploadImageBuffer(b, "maheshelectricals/products"))
          ).then((urls) => {
            let finalVariantImages = urls;
            if (v.images && Array.isArray(v.images)) {
              finalVariantImages = [];
              v.images.forEach((item) => {
                if (item.startsWith("new:")) {
                  const fileIdx = parseInt(item.split(":")[1]);
                  if (!isNaN(fileIdx) && urls[fileIdx]) {
                    finalVariantImages.push(urls[fileIdx]);
                  }
                } else {
                  if (product.variants?.[idx]?.images?.includes(item)) {
                    finalVariantImages.push(item);
                  }
                }
              });
            }
            v.images = finalVariantImages;
          })
        );
      } else if (v.images && Array.isArray(v.images)) {
        v.images = v.images.filter(
          item => !item.startsWith("new:") && product.variants?.[idx]?.images?.includes(item)
        );
      } else {
        v.images = product.variants?.[idx]?.images || [];
      }
    });

    await Promise.all(uploadTasks);
    validateSkus(variants);
    product.variants = variants;
    product.totalInventory = calcInventory(variants);
  }

  // Collection sync (same rahega)
  const tagsChanged = !arraysEqual(oldTags, product.tags || []);

  if (tagsChanged && wasActive) {
    if (oldCollections.length) {
      await Promise.all(
        oldCollections.map(c =>
          Collection.updateOne(
            { collection_id: c.collection_id },
            { $inc: { product_count: -1 } }
          )
        )
      );
    }

    const matched = await matchCollectionsByTags(product.tags || []);
    product.collections = matched;

    if (matched.length) {
      await Promise.all(
        matched.map(c =>
          Collection.updateOne(
            { collection_id: c.collection_id },
            { $inc: { product_count: 1 } }
          )
        )
      );
    }
  }

  await product.save();

  const affectedSlugs = new Set([
    ...oldCollections.map(c => c.slug),
    ...(product.collections || []).map(c => c.slug),
  ]);

  await invalidateProductCaches(
    product.product_id,
    Array.from(affectedSlugs)
  );

  return product;
}


/* ===============================
   HELPER: ARRAYS EQUAL
================================ */
function arraysEqual(a, b) {
  if (a.length !== b.length) return false;
  a = [...a].sort();
  b = [...b].sort();
  return a.every((val, i) => val === b[i]);
}

/* ===============================
   HELPER: INVALIDATE CACHES
================================ */
async function invalidateProductCaches(product_id, affectedSlugs = []) {
  const keysToDel = [
    `PRODUCT_SINGLE_${product_id}`,
    "ALL_PRODUCTS",
    "HOME_COLLECTIONS_all",
    "HOME_COLLECTIONS_category",
    "HOME_COLLECTIONS_collection",
  ];

  affectedSlugs.forEach(slug => {
    keysToDel.push(`PRODUCTS_CATEGORY_${slug}`);
  });

  await Promise.all(keysToDel.map(key => redis.del(key)));
}

/* ===============================
   UPDATE PRODUCT STATUS
================================ */
export async function updateProductStatus(req) {
  const { product_id } = req.body;

  if (!product_id) {
    throw { statusCode: 400, message: "product_id is required" };
  }

  const product = await Product.findOne({ product_id });

  if (!product) {
    throw { statusCode: 404, message: "Product not found" };
  }

  /* 🔻 ACTIVE → DRAFT */
  if (product.status === "Active") {
    await Promise.all(
      product.collections.map((c) =>
        Collection.updateOne(
          { collection_id: c.collection_id },
          { $inc: { product_count: -1 } }
        )
      )
    );

    product.status = "Draft";
    product.collections = [];
    await product.save();

    // 🔥 Invalidate caches
    await invalidateProductCaches(product_id, product.collections.map(c => c.slug));

    return {
      product_id: product.product_id,
      status: "Draft",
    };
  }

  /* 🔺 DRAFT → ACTIVE (QIKINK SAFE) */
  const matched = await matchCollectionsByTags(product.tags || []);

  product.status = "Active";
  product.collections = matched;
  await product.save();

  await Promise.all(
    matched.map((c) =>
      Collection.updateOne(
        { collection_id: c.collection_id },
        { $inc: { product_count: 1 } }
      )
    )
  );

  // 🔥 Invalidate caches
  await invalidateProductCaches(product_id, matched.map(c => c.slug));

  return {
    product_id: product.product_id,
    status: "Active",
  };
}

/* ===============================
   PRODUCT BY CATEGORY
================================ */
export async function productByCategoryService(req) {
  const { category, fast } = req.body;
  if (!category) throw new Error("category is required");

  /* ===============================
     🚀 CATEGORY PRODUCTS (REDIS)
  =============================== */
  if (fast === true) {
    const cacheKey = `PRODUCTS_CATEGORY_${category}`;
    const cached = await redis.get(cacheKey);


    if (cached) {
      console.log("REDIS CATEGORY HIT");
      const products = JSON.parse(cached);
      return {
        category,
        total: products.length,
        products,
        cached: true,
      };
    }

    console.log("REDIS CATEGORY MISS");

    const products = await Product.find({
      status: "Active",
      "collections.slug": category,
    })
      .sort({ createdAt: -1 })
      .lean();

    await redis.set(
      cacheKey,
      JSON.stringify(products),
      "EX",
      30
    );

    return {
      category,
      total: products.length,
      products,
    };
  }

  /* ===============================
     🔹 NORMAL MODE
  =============================== */
  const products = await Product.find({
    status: "Active",
    "collections.slug": category,
  })
    .sort({ createdAt: -1 })
    .lean();

  return { category, total: products.length, products };
}

/* ===============================
   DELETE PRODUCT
================================ */
export async function deleteProductService(req) {
  const { product_id } = req.body;

  const product = await Product.findOne({ product_id });

  if (product && product.status === "Active") {
    await Promise.all(
      product.collections.map((c) =>
        Collection.updateOne(
          { collection_id: c.collection_id },
          { $inc: { product_count: -1 } }
        )
      )
    );
  }

  await Product.deleteOne({ product_id });

  // 🔥 Invalidate caches
  await invalidateProductCaches(product_id, product.collections.map(c => c.slug));

  return { deleted: true };
}

/* ===============================
   REMOVE PRODUCT FROM COLLECTION (NEW API)
================================ */
export async function removeProductFromCollectionService(req) {
  const { product_id, collection_id } = req.body;

  if (!product_id || !collection_id) {
    throw { statusCode: 400, message: "product_id and collection_id required" };
  }

  const product = await Product.findOne({ product_id });
  if (!product) {
    throw { statusCode: 404, message: "Product not found" };
  }

  if (product.status !== "Active") {
    throw { statusCode: 400, message: "Product must be Active to remove from collection" };
  }

  const collectionIndex = product.collections.findIndex(c => c.collection_id === collection_id);
  if (collectionIndex === -1) {
    throw { statusCode: 404, message: "Product not in this collection" };
  }

  const removedCollection = product.collections[collectionIndex];

  // Remove from product
  product.collections.splice(collectionIndex, 1);
  await product.save();

  // Decrement count
  await Collection.updateOne(
    { collection_id },
    { $inc: { product_count: -1 } }
  );

  // 🔥 Invalidate caches
  await invalidateProductCaches(product_id, [removedCollection.slug]);

  return {
    success: true,
    message: "Product removed from collection",
    note: "If tags still match, it may be re-added on next update/save"
  };
}

/* ===============================
   PRODUCT DETAIL (BY SLUG)
================================ */
export async function productDetailService(req) {
  const { slug, fast } = req.body;

  if (!slug) {
    throw new Error("slug is required");
  }

  const cacheKey = `PRODUCT_DETAIL_${slug}`;

  /* ===============================
     🚀 REDIS (FAST MODE)
  =============================== */
  if (fast === true) {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return {
        mode: "single",
        product: JSON.parse(cached),
        cached: true,
      };
    }
  }

  /* ===============================
     🔍 DB QUERY
  =============================== */
  const product = await Product.findOne({
    slug,
    status: "Active",
  }).lean();

  if (!product) {
    throw new Error("Product not found");
  }

  /* ===============================
     🔥 CACHE SAVE
  =============================== */
  if (fast === true) {
    await redis.set(cacheKey, JSON.stringify(product), "EX", 30);
  }

  return {
    mode: "single",
    product,
  };
}