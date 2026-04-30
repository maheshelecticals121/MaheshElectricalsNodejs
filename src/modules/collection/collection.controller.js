// src/modules/collection/collection.controller.js
import * as service from "./collection.service.js";

/* ===============================
   ERROR FORMATTER
================================ */
function formatError(err) {
  // mongoose validation
  if (err.name === "ValidationError") {
    return {
      statusCode: 400,
      message: Object.values(err.errors)
        .map((e) => e.message)
        .join(", "),
      type: "VALIDATION_ERROR",
    };
  }

  // custom errors
  if (err.statusCode) {
    return {
      statusCode: err.statusCode,
      message: err.message,
      type: err.type || "CUSTOM_ERROR",
    };
  }

  // fallback
  return {
    statusCode: 500,
    message: "Internal Server Error",
    type: "SERVER_ERROR",
  };
}

/* ===============================
   ADD / UPDATE COLLECTION
================================ */
export async function addCollection(req, reply) {
  try {
    const collection = await service.addCollection(req);

    return reply.send({
      success: true,
      data: collection,
    });
  } catch (err) {
    console.error("❌ ADD COLLECTION ERROR:", err);
    const e = formatError(err);

    return reply.status(e.statusCode).send({
      success: false,
      message: e.message,
      type: e.type,
    });
  }
}

/* ===============================
   GET COLLECTIONS
   - list
   - single
================================ */
export async function getCollections(req, reply) {
  try {
    const result = await service.getCollections(req);

    return reply.send({
      success: true,
      mode: result.mode,     // 👈 "single" | "list"
      data: result.data,     // 👈 object | array
    });
  } catch (err) {
    console.error("❌ GET COLLECTION ERROR:", err);
    const e = formatError(err);

    return reply.status(e.statusCode).send({
      success: false,
      message: e.message,
      type: e.type,
    });
  }
}

/* ===============================
   DELETE COLLECTION
================================ */
export async function deleteCollection(req, reply) {
  try {
    const result = await service.deleteCollection(req);

    return reply.send({
      success: true,
      ...result,
    });
  } catch (err) {
    console.error("❌ DELETE COLLECTION ERROR:", err);
    const e = formatError(err);

    return reply.status(e.statusCode).send({
      success: false,
      message: e.message,
      type: e.type,
    });
  }
}
