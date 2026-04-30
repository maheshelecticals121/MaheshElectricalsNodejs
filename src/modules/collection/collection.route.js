// src/modules/collection/collection.route.js
import {
    addCollection,
    getCollections,
    deleteCollection
  } from "./collection.controller.js";
  
  import { adminMiddleware } from "../../middlewares/auth.middleware.js";
  
  export default async function collectionRoutes(app) {
    app.post(
      "/add_collection",
      { preValidation: adminMiddleware }, // ✅ FIXED
      addCollection
    );
  
    app.post("/get_collections", getCollections);

    app.post(
        "/delete_collection",
        { preValidation: adminMiddleware },
        deleteCollection
      );
  }
  