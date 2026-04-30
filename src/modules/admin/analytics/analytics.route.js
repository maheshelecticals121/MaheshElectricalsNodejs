// src/modules/admin/analytics/analytics.route.js

import { adminMiddleware } from "../../../middlewares/auth.middleware.js";
import { getAnalyticsOverview } from "./analytics.controller.js";


export default async function analyticsRoutes(app) {
  app.post(
    "/analytics",
    { preHandler: adminMiddleware },
    getAnalyticsOverview
  );
}