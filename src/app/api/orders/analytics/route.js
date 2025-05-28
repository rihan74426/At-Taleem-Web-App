import { connect } from "@/lib/mongodb/mongoose";
import Order from "@/lib/models/Order";
import { getAuth } from "@clerk/nextjs/server";
import { rateLimit } from "@/lib/rate-limit";
import { LRUCache } from "lru-cache";

// Cache configuration
const cache = new LRUCache({
  max: 500,
  ttl: 1000 * 60 * 5, // 5 minutes
});

// Rate limiting configuration
const limiter = rateLimit({
  interval: 60 * 1000,
  uniqueTokenPerInterval: 500,
});

export async function GET(req) {
  try {
    // Rate limiting
    await limiter.check(10);

    // Authentication check
    const { userId } = getAuth(req);
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    // Connect to database
    await connect();

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "month"; // day, week, month, year
    const type = searchParams.get("type") || "summary"; // summary, trends, export

    // Generate cache key
    const cacheKey = `analytics:${userId}:${period}:${type}`;

    // Check cache
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return new Response(JSON.stringify(cachedData), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Calculate date range
    const now = new Date();
    const startDate = new Date();
    switch (period) {
      case "day":
        startDate.setDate(now.getDate() - 1);
        break;
      case "week":
        startDate.setDate(now.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(now.getMonth() - 1);
        break;
      case "year":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    let data;
    switch (type) {
      case "summary":
        data = await getSummaryAnalytics(userId, startDate, now);
        break;
      case "trends":
        data = await getTrendAnalytics(userId, startDate, now);
        break;
      case "export":
        data = await getExportData(userId, startDate, now);
        break;
      default:
        throw new Error("Invalid analytics type");
    }

    // Cache the results
    cache.set(cacheKey, data);

    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}

// Helper function to get summary analytics
async function getSummaryAnalytics(userId, startDate, endDate) {
  const [
    totalOrders,
    totalRevenue,
    averageOrderValue,
    statusDistribution,
    paymentMethodDistribution,
  ] = await Promise.all([
    Order.countDocuments({
      userId,
      createdAt: { $gte: startDate, $lte: endDate },
    }),
    Order.aggregate([
      {
        $match: {
          userId,
          createdAt: { $gte: startDate, $lte: endDate },
          paymentStatus: "Paid",
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]),
    Order.aggregate([
      {
        $match: {
          userId,
          createdAt: { $gte: startDate, $lte: endDate },
          paymentStatus: "Paid",
        },
      },
      {
        $group: {
          _id: null,
          average: { $avg: "$amount" },
        },
      },
    ]),
    Order.aggregate([
      {
        $match: {
          userId,
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]),
    Order.aggregate([
      {
        $match: {
          userId,
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: "$paymentMethod",
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  return {
    totalOrders,
    totalRevenue: totalRevenue[0]?.total || 0,
    averageOrderValue: averageOrderValue[0]?.average || 0,
    statusDistribution: statusDistribution.reduce(
      (acc, { _id, count }) => ({ ...acc, [_id]: count }),
      {}
    ),
    paymentMethodDistribution: paymentMethodDistribution.reduce(
      (acc, { _id, count }) => ({ ...acc, [_id]: count }),
      {}
    ),
  };
}

// Helper function to get trend analytics
async function getTrendAnalytics(userId, startDate, endDate) {
  const dailyOrders = await Order.aggregate([
    {
      $match: {
        userId,
        createdAt: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
        },
        count: { $sum: 1 },
        revenue: { $sum: "$amount" },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]);

  return {
    dailyOrders: dailyOrders.map(({ _id, count, revenue }) => ({
      date: _id,
      orders: count,
      revenue,
    })),
  };
}

// Helper function to get export data
async function getExportData(userId, startDate, endDate) {
  const orders = await Order.find({
    userId,
    createdAt: { $gte: startDate, $lte: endDate },
  })
    .populate("items.bookId")
    .sort({ createdAt: -1 });

  return orders.map((order) => ({
    orderId: order._id,
    date: order.createdAt,
    status: order.status,
    paymentStatus: order.paymentStatus,
    amount: order.amount,
    items: order.items.map((item) => ({
      bookTitle: item.bookId.title,
      quantity: item.qty,
      price: item.price,
    })),
    customer: {
      name: order.buyerName,
      email: order.buyerEmail,
      phone: order.deliveryPhone,
    },
    deliveryAddress: order.deliveryAddress,
    tracking: order.tracking,
  }));
}
