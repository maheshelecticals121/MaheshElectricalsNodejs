import { Product } from "../../models/Product.model.js";
import { uploadImageBuffer } from "../../utils/uploadToCloudinary.js";
import redis from "../../config/redis.js";

/* ===============================
   HELPER: SAFE JSON PARSE
================================ */
function safeJSONParse(value, fallback = []) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

/* ===============================
   HELPER: SLUG
================================ */
async function generateUniqueSlug(baseSlug, productId = null) {
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const query = { slug };
    if (productId) query.product_id = { $ne: productId };

    const exists = await Product.findOne(query).lean();
    if (!exists) break;

    counter++;
    slug = `${baseSlug}-${counter}`;
  }

  return slug;
}

/* ===============================
   SAVE PRODUCT (CREATE / UPDATE)
================================ */
export async function saveProduct(req, reply) {
  try {
    const fields = {};
    const imageBuffers = [];

    for await (const part of req.parts()) {
      if (part.type === "file") {
        if (part.fieldname === "mainImages") {
          imageBuffers.push(await part.toBuffer());
        }
      } else {
        fields[part.fieldname] = part.value;
      }
    }

    /* 🔥 VALIDATION */
    if (!fields.title) throw new Error("Title required");
    if (!fields.slug) throw new Error("Slug required");

    /* ================= CREATE ================= */
    if (!fields.product_id) {
      const adminId = req.user?.id;
      if (!adminId) throw new Error("Unauthorized");

      const finalSlug = await generateUniqueSlug(fields.slug);

      /* 🔥 IMAGE UPLOAD */
      const uploadedImages = [];
      for (const buffer of imageBuffers) {
        const img = await uploadImageBuffer(
          buffer,
          "maheshelectricals/products",
          { quality: "auto", format: "webp" }
        );
        uploadedImages.push(img);
      }

      const product = await Product.create({
        title: fields.title,
        slug: finalSlug,
        description: fields.description || "",

        pageTitle: fields.pageTitle || fields.title,
        metaDescription: fields.metaDescription || "",

        price: Number(fields.price || 0),

        category: fields.category || "electrical",

        // 🔥 NEW
        subCategory: fields.subCategory || "",

        tags: safeJSONParse(fields.tags),

        mainImages: uploadedImages,

        status: fields.status || "Active",

        createdBy: adminId,
      });

      await redis.del("ALL_PRODUCTS");

      return reply.send({
        success: true,
        mode: "create",
        product,
      });
    }

    /* ================= UPDATE ================= */
    const product = await Product.findOne({
      product_id: fields.product_id,
    });

    if (!product) throw new Error("Product not found");

    if (fields.title !== undefined) product.title = fields.title;
    if (fields.description !== undefined)
      product.description = fields.description;

    if (fields.slug && fields.slug !== product.slug) {
      product.slug = await generateUniqueSlug(
        fields.slug,
        product.product_id
      );
    }

    if (fields.price !== undefined)
      product.price = Number(fields.price);

    if (fields.category !== undefined)
      product.category = fields.category;

    // 🔥 NEW
    if (fields.subCategory !== undefined)
      product.subCategory = fields.subCategory;

    if (fields.tags !== undefined)
      product.tags = safeJSONParse(fields.tags);

    if (fields.status !== undefined)
      product.status = fields.status;

    /* 🔥 IMAGE UPDATE */
    if (imageBuffers.length) {
      for (const buffer of imageBuffers) {
        const img = await uploadImageBuffer(
          buffer,
          "maheshelectricals/products",
          { quality: "auto", format: "webp" }
        );
        product.mainImages.push(img);
      }
    }

    await product.save();
    await redis.del("ALL_PRODUCTS");

    return reply.send({
      success: true,
      mode: "update",
      product,
    });
  } catch (err) {
    return reply.code(500).send({
      success: false,
      message: err.message,
    });
  }
}

/* ===============================
   GET PRODUCT
================================ */
export async function getProduct(req, reply) {
  try {
    const { product_id } = req.body || {};

    if (product_id) {
      const product = await Product.findOne({ product_id }).lean();
      if (!product) throw new Error("Product not found");

      return reply.send({
        success: true,
        mode: "single",
        product,
      });
    }

    const products = await Product.find()
      .sort({ createdAt: -1 })
      .lean();

    return reply.send({
      success: true,
      mode: "list",
      products,
    });
  } catch (err) {
    return reply.code(500).send({
      success: false,
      message: err.message,
    });
  }
}

/* ===============================
   PRODUCT BY CATEGORY
================================ */
export async function productByCategory(req, reply) {
  try {
    const { category } = req.body;

    const products = await Product.find({
      status: "Active",
      category,
    })
      .sort({ createdAt: -1 })
      .lean();

    return reply.send({
      success: true,
      category,
      total: products.length,
      products,
    });
  } catch (err) {
    return reply.code(400).send({
      success: false,
      message: err.message,
    });
  }
}

/* ===============================
   PRODUCT DETAIL
================================ */
export async function productDetail(req, reply) {
  try {
    const { slug } = req.body;

    const product = await Product.findOne({
      slug,
      status: "Active",
    }).lean();

    if (!product) throw new Error("Product not found");

    return reply.send({
      success: true,
      product,
    });
  } catch (err) {
    return reply.code(400).send({
      success: false,
      message: err.message,
    });
  }
}

/* ===============================
   DELETE PRODUCT
================================ */
export async function deleteProduct(req, reply) {
  try {
    const { product_id } = req.body;

    await Product.deleteOne({ product_id });

    await redis.del("ALL_PRODUCTS");

    return reply.send({
      success: true,
      deleted: true,
    });
  } catch (err) {
    return reply.code(400).send({
      success: false,
      message: err.message,
    });
  }
}

/* ===============================
   TOGGLE PRODUCT STATUS
================================ */
export async function updateProductStatus(req, reply) {
  try {
    const { product_id } = req.body;

    if (!product_id) throw new Error("product_id required");

    const product = await Product.findOne({ product_id });
    if (!product) throw new Error("Product not found");

    product.status = product.status === "Active" ? "Draft" : "Active";

    await product.save();
    await redis.del("ALL_PRODUCTS");

    return reply.send({
      success: true,
      product_id,
      status: product.status,
    });
  } catch (err) {
    return reply.code(400).send({
      success: false,
      message: err.message,
    });
  }
}
export async function relatedProducts(req, reply) {
  try {
    const { slug } = req.body;

    const product = await Product.findOne({ slug });

    if (!product) throw new Error("Product not found");

    const related = await Product.find({
      status: "Active",
      slug: { $ne: slug }, // exclude current
      $or: [
        { subCategory: product.subCategory },
        { category: product.category }
      ]
    })
      .limit(4)
      .lean();

    return reply.send({
      success: true,
      products: related
    });

  } catch (err) {
    return reply.code(400).send({
      success: false,
      message: err.message
    });
  }
}