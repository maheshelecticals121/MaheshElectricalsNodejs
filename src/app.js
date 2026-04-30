// src/app.js

import Fastify from "fastify";
import cors from "@fastify/cors";
// import jwt from "@fastify/jwt";
import multipart from "@fastify/multipart";

/* ===============================
   ROUTE IMPORTS
================================ */

// ADMIN CORE
import adminRoutes from "./modules/admin/admin.route.js";
import adminUserRoute from "./modules/admin/admin-user/adminUser.route.js";
import analyticsRoutes from "./modules/admin/analytics/analytics.route.js";

// ADMIN FEATURES
import adminNotificationRoutes from "./modules/admin/notification/adminNotification.route.js";
import AdminOrdersRoutes from "./modules/order/admin_orders/adminOrder.route.js";

// ADMIN DATA
import collectionRoutes from "./modules/collection/collection.route.js";
import productRoutes from "./modules/product/product.route.js";
import contactRoutes from "./modules/contactus/contact.route.js"

// USER
import userRoutes from "./modules/user/user.route.js";
import orderRoutes from "./modules/order/user_orders/userOrder.route.js";
import abandonedCartRoutes from "./modules/order/abandoned_cart/abandonedCart.route.js"
import podRoutes from "./modules/pod/pod.route.js"

export default async function buildApp() {
  /* ===============================
     🚀 FASTIFY INSTANCE
  =============================== */
  const app = Fastify({
    logger: true,
    trustProxy: true,
    disableRequestLogging: true,
    bodyLimit: 6 * 1024 * 1024, // 6MB
  });

  /* ===============================
     🌐 CORS
  =============================== */
  await app.register(cors, {
    origin: true,
    credentials: true,
    maxAge: 86400,
  });

  /* ===============================
     🔐 JWT
  =============================== */
  // await app.register(jwt, {
  //   secret: process.env.JWT_SECRET,
  // });

  /* ===============================
     🖼️ MULTIPART (UPLOADS)
  =============================== */
  await app.register(multipart, {
    attachFieldsToBody: false,
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
      files: 20,
    },
  });

  /* ===============================
     ⚠️ GLOBAL ERROR HANDLER
  =============================== */
  app.setErrorHandler((error, req, reply) => {
    const statusCode = error.statusCode || 500;

    // Mongoose validation
    if (error.name === "ValidationError") {
      return reply.status(400).send({
        success: false,
        type: "VALIDATION_ERROR",
        message: Object.values(error.errors)
          .map((e) => e.message)
          .join(", "),
      });
    }

    // JWT missing
    if (error.code === "FST_JWT_NO_AUTHORIZATION") {
      return reply.status(401).send({
        success: false,
        message: "Authorization token missing",
      });
    }

    return reply.status(statusCode).send({
      success: false,
      message: error.message || "Internal Server Error",
    });
  });

  /* ===============================
     🧑‍💼 ADMIN ROUTES
     prefix: /api/admin_link
  =============================== */
  const ADMIN_PREFIX = "/api/admin_link";

  await app.register(adminRoutes, { prefix: ADMIN_PREFIX });
  await app.register(adminUserRoute, { prefix: ADMIN_PREFIX });
  await app.register(AdminOrdersRoutes, { prefix: ADMIN_PREFIX });
  await app.register(adminNotificationRoutes, { prefix: ADMIN_PREFIX });
  await app.register(analyticsRoutes, { prefix: ADMIN_PREFIX });
  await app.register(abandonedCartRoutes, { prefix: ADMIN_PREFIX });
  await app.register(podRoutes, { prefix: ADMIN_PREFIX });

  /* ===============================
     📦 COLLECTION & PRODUCT (ADMIN)
  =============================== */
  await app.register(collectionRoutes, { prefix: ADMIN_PREFIX });
  await app.register(productRoutes, { prefix: ADMIN_PREFIX });
  await app.register(contactRoutes, { prefix: ADMIN_PREFIX });

  /* ===============================
     👤 USER ROUTES
     prefix: /api/user_link
  =============================== */
  const USER_PREFIX = "/api/user_link";

  await app.register(userRoutes, { prefix: USER_PREFIX });
  await app.register(orderRoutes, { prefix: USER_PREFIX });

  /* ===============================
     🧪 HEALTH CHECK
  =============================== */
  app.get("/test", async () => ({
    success: true,
    message: "Server OK 🚀",
  }));

  return app;
}
