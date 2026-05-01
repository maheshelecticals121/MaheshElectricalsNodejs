import { adminMiddleware } from "../../middlewares/auth.middleware.js";
import {
  getProduct,
  saveProduct,
productByCategory,deleteProduct,
  productDetail
  ,
  updateProductStatus
} from "./product.controller.js";

export default async function productRoutes(app) {
  console.log("✅ PRODUCT ROUTES REGISTERED");

  app.post(
    "/product/save",
    { preHandler: adminMiddleware },
    saveProduct
  );

  app.post(
    "/product",
    { preHandler: adminMiddleware },
    getProduct
  );
  app.post(
    "/product/product_by_category",
    productByCategory
  );
  app.post(
    "/product/product_detail",
    productDetail
  );
  app.post(
    "/product/delete_product",
    { preHandler: adminMiddleware },
    deleteProduct
  );
  app.post(
    "/product/status",
    { preHandler: adminMiddleware },
    updateProductStatus
  );
}
