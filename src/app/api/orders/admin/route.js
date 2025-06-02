import { connect } from "@/lib/mongodb/mongoose";
import Order from "@/lib/models/Order";
import { rateLimit } from "@/lib/rate-limit";
import { getAuth } from "@clerk/nextjs/server";

// Rate limiter: 10 requests per minute
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
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
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const status = searchParams.get("status");
    const paymentStatus = searchParams.get("paymentStatus");
    const dateRange = searchParams.get("dateRange");
    const search = searchParams.get("search");

    // Build query
    const query = {};
    if (status && status !== "all") query.status = status;
    if (paymentStatus && paymentStatus !== "all")
      query.paymentStatus = paymentStatus;
    if (search) {
      query.$or = [
        { orderId: { $regex: search, $options: "i" } },
        { buyerName: { $regex: search, $options: "i" } },
        { buyerEmail: { $regex: search, $options: "i" } },
        { deliveryPhone: { $regex: search, $options: "i" } },
      ];
    }

    // Date range filter
    if (dateRange && dateRange !== "all") {
      const now = new Date();
      let startDate;
      switch (dateRange) {
        case "today":
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case "week":
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case "month":
          startDate = new Date(now.setDate(now.getDate() - 30));
          break;
        default:
          startDate = new Date(0);
      }
      query.createdAt = { $gte: startDate };
    }

    // Get orders with pagination
    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("items.bookId"),
      Order.countDocuments(query),
    ]);

    // Calculate statistics
    const stats = await Order.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          totalRevenue: { $sum: "$amount" },
          pending: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
          },
          processing: {
            $sum: { $cond: [{ $eq: ["$status", "processing"] }, 1, 0] },
          },
          delivery: {
            $sum: { $cond: [{ $eq: ["$status", "delivery"] }, 1, 0] },
          },
          completed: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
          failed: {
            $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] },
          },
          cancelled: {
            $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] },
          },
        },
      },
    ]);

    return new Response(
      JSON.stringify({
        orders,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        stats: stats[0] || {
          total: 0,
          totalRevenue: 0,
          pending: 0,
          processing: 0,
          delivery: 0,
          completed: 0,
          failed: 0,
          cancelled: 0,
        },
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error in admin orders API:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  }
}

export async function POST(req) {
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

    const body = await req.json();
    const { action, orderIds } = body;

    if (!action || !orderIds || !Array.isArray(orderIds)) {
      return new Response(
        JSON.stringify({ error: "Invalid request parameters" }),
        { status: 400 }
      );
    }

    let update = {};
    switch (action) {
      case "mark-processing":
        update = { status: "processing" };
        break;
      case "mark-delivery":
        update = { status: "delivery" };
        break;
      case "mark-completed":
        update = { status: "completed" };
        break;
      case "mark-failed":
        update = { status: "failed" };
        break;
      case "mark-cancelled":
        update = { status: "cancelled" };
        break;
      default:
        return new Response(JSON.stringify({ error: "Invalid action" }), {
          status: 400,
        });
    }

    // Add tracking update
    const trackingUpdate = {
      status: update.status,
      message: `Order status updated to ${update.status}`,
      timestamp: new Date(),
    };

    // Update orders
    const result = await Order.updateMany(
      { _id: { $in: orderIds } },
      {
        $set: update,
        $push: { tracking: trackingUpdate },
      }
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully updated ${result.modifiedCount} orders`,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error in admin orders API:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  }
}
