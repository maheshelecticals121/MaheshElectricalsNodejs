// src/modules/admin/analytics/analytics.controller.js

import { getAnalyticsOverviewService } from "./analytics.service.js";

/* =====================================
   ADMIN – ANALYTICS (SINGLE SOURCE)
   Handles:
   - Dashboard stats
   - Top products
   - Customers
   - Charts
===================================== */
export async function getAnalyticsOverview(req, reply) {
  try {
    const {
      range = "today", // today | 7d | 1m | 3m | 6m | custom
      fromDate,
      toDate,
    } = req.body || {};

    const data = await getAnalyticsOverviewService({
      range,
      fromDate,
      toDate,
    });

    return reply.send({
      success: true,
      range,
      data,
    });
  } catch (error) {
    console.error("Analytics error:", error);

    return reply.code(400).send({
      success: false,
      message: error.message,
    });
  }
}