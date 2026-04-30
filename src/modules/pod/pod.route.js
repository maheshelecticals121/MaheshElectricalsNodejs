// src/modules/pod/pod.route.js

import {
  savePodController,
  getAllPodController,
} from "./pod.controller.js";

export default async function podRoutes(app) {
  // ✅ multipart already registered globally
  app.post(
    "/save_pod",
    {
      preHandler: app.multipart, // ✅ bas use karo
    },
    savePodController
  );

  app.post("/get_all_pod", getAllPodController);
}
