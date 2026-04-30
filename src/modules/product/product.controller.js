import * as productService from "./product.service.js";

/* ===============================
   SAVE PRODUCT (CREATE / UPDATE)
================================ */
export async function saveProduct(req, reply) {
  try {
    const result = await productService.saveProductService(req);

    return reply.send({
      success: true,
      ...result, // mode, product_id, product
    });
  } catch (err) {
    req.log?.error(err);

    return reply.code(err.statusCode || 500).send({
      success: false,
      message: err.message || "Failed to save product",
    });
  }
}

/* ===============================
   GET PRODUCT (LIST / SINGLE)
================================ */
export async function getProduct(req, reply) {
  try {
    const result = await productService.getProductService(req);

    return reply.send({
      success: true,
      ...result, // mode + product / products
    });
  } catch (err) {
    req.log?.error(err);

    return reply.code(err.statusCode || 500).send({
      success: false,
      message: err.message || "Failed to fetch product(s)",
    });
  }
}

/* ===============================
   TOGGLE PRODUCT STATUS
================================ */
export async function updateProductStatus(req, reply) {
  try {
    const result = await productService.updateProductStatus(req);

    return reply.send({
      success: true,
      ...result, // product_id, status, counts
    });
  } catch (err) {
    req.log?.error(err);

    return reply.code(err.statusCode || 500).send({
      success: false,
      message: err.message || "Failed to update product status",
    });
  }
}

/* ===============================
   PRODUCT BY CATEGORY
================================ */
export async function productByCategory(req, reply) {
  try {
    const data = await productService.productByCategoryService(req);

    return reply.send({
      success: true,
      ...data,
    });
  } catch (err) {
    req.log?.error(err);

    return reply.code(err.statusCode || 400).send({
      success: false,
      message: err.message || "Failed to fetch products by category",
    });
  }
}

/* ===============================
   DELETE PRODUCT
================================ */
export async function deleteProduct(req, reply) {
  try {
    const result = await productService.deleteProductService(req);

    return reply.send({
      success: true,
      ...result, // deleted, deletedCount
    });
  } catch (err) {
    req.log?.error(err);

    return reply.code(err.statusCode || 400).send({
      success: false,
      message: err.message || "Failed to delete product",
    });
  }
}

/* ===============================
   PRODUCT DETAIL (BY SLUG)
================================ */
export async function productDetail(req, reply) {
  try {
    const data = await productService.productDetailService(req);
    return reply.send({
      success: true,
      ...data,
    });
  } catch (err) {
    req.log?.error(err);
    return reply.code(err.statusCode || 400).send({
      success: false,
      message: err.message || "Failed to fetch product",
    });
  }
}
