import { Order } from "../../../models/Order.model.js";

/* =============================== 
   DATE RANGE BUILDER 
================================ */
function buildDateFilter({ range, fromDate, toDate }) {
  const now = new Date();
  let start;

  switch (range) {
    case "today":
      start = new Date();
      start.setHours(0, 0, 0, 0);
      break;
    case "7d":
      start = new Date();
      start.setDate(now.getDate() - 7);
      break;
    case "1m":
      start = new Date();
      start.setMonth(now.getMonth() - 1);
      break;
    case "3m":
      start = new Date();
      start.setMonth(now.getMonth() - 3);
      break;
    case "6m":
      start = new Date();
      start.setMonth(now.getMonth() - 6);
      break;
    case "custom":
      if (!fromDate || !toDate) {
        throw new Error("fromDate and toDate required for custom range");
      }
      return {
        createdAt: {
          $gte: new Date(fromDate),
          $lte: new Date(toDate),
        },
      };
    default:
      throw new Error("Invalid range");
  }

  return { createdAt: { $gte: start } };
}

/* ===================================== 
   ANALYTICS – FULLY DYNAMIC & OPTIMIZED
===================================== */
export async function getAnalyticsOverviewService(filters) {
  const dateFilter = buildDateFilter(filters);
  
  const matchStage = {
    $match: {
      ...dateFilter,
      orderStatus: { $ne: "cancelled" },
    },
  };

  // PARALLEL EXECUTION FOR FAST RESPONSE
  const [
    coreStats,
    statusAgg,
    topProducts,
    productVariants,
    customerAgg,
    revenueTimeline,
    hourlyData,
    geographicData,
    cityData,
    conversionStats,
  ] = await Promise.all([
    // 1. CORE STATS
    Order.aggregate([
      matchStage,
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
          totalOrders: { $sum: 1 },
          totalItemsSold: { $sum: { $sum: "$items.quantity" } },
          avgOrderValue: { $avg: "$totalAmount" },
          codOrders: { $sum: { $cond: [{ $eq: ["$paymentMethod", "COD"] }, 1, 0] } },
          onlineOrders: { $sum: { $cond: [{ $eq: ["$paymentMethod", "ONLINE"] }, 1, 0] } },
          codRevenue: {
            $sum: { $cond: [{ $eq: ["$paymentMethod", "COD"] }, "$totalAmount", 0] },
          },
          onlineRevenue: {
            $sum: { $cond: [{ $eq: ["$paymentMethod", "ONLINE"] }, "$totalAmount", 0] },
          },
          paidPayments: { $sum: { $cond: [{ $eq: ["$paymentStatus", "paid"] }, 1, 0] } },
          pendingPayments: { $sum: { $cond: [{ $eq: ["$paymentStatus", "pending"] }, 1, 0] } },
          refundedPayments: { $sum: { $cond: [{ $eq: ["$paymentStatus", "refunded"] }, 1, 0] } },
        },
      },
    ]).then(r => r[0]),

    // 2. ORDER STATUS
    Order.aggregate([
      matchStage,
      { $group: { _id: "$orderStatus", count: { $sum: 1 }, revenue: { $sum: "$totalAmount" } } },
    ]),

    // 3. TOP PRODUCTS
    Order.aggregate([
      matchStage,
      { $unwind: "$items" },
      {
        $group: {
          _id: { product_id: "$items.product_id", title: "$items.title" },
          quantity: { $sum: "$items.quantity" },
          revenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } },
          orders: { $sum: 1 },
          avgPrice: { $avg: "$items.price" },
        },
      },
      { $sort: { quantity: -1 } },
      { $limit: 10 },
      {
        $project: {
          _id: 0,
          product_id: "$_id.product_id",
          title: "$_id.title",
          quantity: 1,
          revenue: 1,
          orders: 1,
          avgPrice: 1,
        },
      },
    ]),

    // 4. VARIANT PERFORMANCE
    Order.aggregate([
      matchStage,
      { $unwind: "$items" },
      {
        $group: {
          _id: { title: "$items.title", color: "$items.color", size: "$items.size" },
          quantity: { $sum: "$items.quantity" },
          revenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } },
        },
      },
      { $sort: { quantity: -1 } },
      { $limit: 20 },
    ]),

    // 5. CUSTOMER ANALYTICS
    Order.aggregate([
      matchStage,
      {
        $group: {
          _id: "$user_id",
          orders: { $sum: 1 },
          spent: { $sum: "$totalAmount" },
          itemsPurchased: { $sum: { $sum: "$items.quantity" } },
          lastOrderDate: { $max: "$createdAt" },
        },
      },
      { $sort: { spent: -1 } },
    ]),

    // 6. REVENUE TIMELINE
    Order.aggregate([
      matchStage,
      {
        $group: {
          _id: { day: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } } },
          revenue: { $sum: "$totalAmount" },
          orders: { $sum: 1 },
          itemsSold: { $sum: { $sum: "$items.quantity" } },
        },
      },
      { $sort: { "_id.day": 1 } },
      { $project: { _id: 0, date: "$_id.day", revenue: 1, orders: 1, itemsSold: 1 } },
    ]),

    // 7. HOURLY DATA (TODAY ONLY)
    filters.range === "today"
      ? Order.aggregate([
          matchStage,
          {
            $group: {
              _id: { $hour: "$createdAt" },
              orders: { $sum: 1 },
              revenue: { $sum: "$totalAmount" },
            },
          },
          { $sort: { _id: 1 } },
          { $project: { _id: 0, hour: "$_id", orders: 1, revenue: 1 } },
        ])
      : Promise.resolve([]),

    // 8. GEOGRAPHIC DATA (STATE)
    Order.aggregate([
      matchStage,
      {
        $group: {
          _id: "$shippingAddress.state",
          orders: { $sum: 1 },
          revenue: { $sum: "$totalAmount" },
          cities: { $addToSet: "$shippingAddress.city" },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
      {
        $project: {
          _id: 0,
          state: "$_id",
          orders: 1,
          revenue: 1,
          uniqueCities: { $size: "$cities" },
        },
      },
    ]),

    // 9. CITY-LEVEL DATA
    Order.aggregate([
      matchStage,
      {
        $group: {
          _id: { state: "$shippingAddress.state", city: "$shippingAddress.city" },
          orders: { $sum: 1 },
          revenue: { $sum: "$totalAmount" },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 15 },
      {
        $project: {
          _id: 0,
          state: "$_id.state",
          city: "$_id.city",
          orders: 1,
          revenue: 1,
        },
      },
    ]),

    // 10. CONVERSION FUNNEL
    Order.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $ne: ["$orderStatus", "cancelled"] }, 1, 0] },
          },
          cancelled: {
            $sum: { $cond: [{ $eq: ["$orderStatus", "cancelled"] }, 1, 0] },
          },
        },
      },
    ]).then(r => r[0] || { total: 0, completed: 0, cancelled: 0 }),
  ]);

  // PROCESS ORDER STATUS
  const orderStatus = {
    pending: { count: 0, revenue: 0 },
    sent_to_qikink: { count: 0, revenue: 0 },
    shipped: { count: 0, revenue: 0 },
    delivered: { count: 0, revenue: 0 },
    cancelled: { count: 0, revenue: 0 },
  };

  statusAgg.forEach((s) => {
    if (orderStatus[s._id] !== undefined) {
      orderStatus[s._id] = { count: s.count, revenue: s.revenue };
    }
  });

  // PROCESS CUSTOMER DATA
  let newCustomers = 0;
  let repeatCustomers = 0;
  
  customerAgg.forEach((c) => {
    if (c.orders > 1) repeatCustomers++;
    else newCustomers++;
  });

  const topCustomers = customerAgg.slice(0, 10).map((c) => ({
    user_id: c._id,
    orders: c.orders,
    spent: c.spent,
    itemsPurchased: c.itemsPurchased,
    avgOrderValue: Math.round(c.spent / c.orders),
    lastOrderDate: c.lastOrderDate,
  }));

  // PAYMENT METHOD DATA
  const paymentMethodData = [
    {
      method: "COD",
      orders: coreStats?.codOrders || 0,
      revenue: coreStats?.codRevenue || 0,
      percentage: coreStats?.totalOrders
        ? ((coreStats.codOrders / coreStats.totalOrders) * 100).toFixed(1)
        : "0",
    },
    {
      method: "ONLINE",
      orders: coreStats?.onlineOrders || 0,
      revenue: coreStats?.onlineRevenue || 0,
      percentage: coreStats?.totalOrders
        ? ((coreStats.onlineOrders / coreStats.totalOrders) * 100).toFixed(1)
        : "0",
    },
  ];

  // CONVERSION FUNNEL
  const conversionFunnel = {
    initiated: conversionStats.total,
    completed: conversionStats.completed,
    cancelled: conversionStats.cancelled,
    conversionRate: conversionStats.total
      ? ((conversionStats.completed / conversionStats.total) * 100).toFixed(2)
      : "0",
  };

  // FINAL RESPONSE
  return {
    overview: {
      revenue: coreStats?.totalRevenue || 0,
      orders: coreStats?.totalOrders || 0,
      itemsSold: coreStats?.totalItemsSold || 0,
      avgOrderValue: coreStats?.avgOrderValue ? Math.round(coreStats.avgOrderValue) : 0,
    },
    
    payments: {
      methods: paymentMethodData,
      status: {
        paid: coreStats?.paidPayments || 0,
        pending: coreStats?.pendingPayments || 0,
        refunded: coreStats?.refundedPayments || 0,
      },
    },
    
    orderStatus,
    
    customers: {
      total: customerAgg.length,
      new: newCustomers,
      repeat: repeatCustomers,
      repeatRate: customerAgg.length
        ? ((repeatCustomers / customerAgg.length) * 100).toFixed(1)
        : "0",
      topCustomers,
    },
    
    products: {
      topSelling: topProducts,
      variantPerformance: productVariants,
    },
    
    geographic: {
      byState: geographicData,
      byCity: cityData,
    },
    
    conversionFunnel,
    
    charts: {
      revenueTimeline,
      hourlyData,
    },
  };
}