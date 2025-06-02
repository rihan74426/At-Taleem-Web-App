import { connect } from "@/lib/mongodb/mongoose";
import Order from "@/lib/models/Order";
import { rateLimit } from "@/lib/rate-limit";
import { buildOrderEmailTemplate } from "@/app/utils/emailTemplates";

// Rate limiter: 10 requests per minute
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});

export async function GET(req) {
  try {
    // Rate limiting
    await limiter.check(10);

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
    const sortBy = searchParams.get("sortBy") || "newest";

    // Build query
    const query = {};
    if (status && status !== "all") query.status = status;
    if (paymentStatus && paymentStatus !== "all")
      query.paymentStatus = paymentStatus;
    if (search) {
      query.$or = [
        { _id: { $regex: search, $options: "i" } },
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

    // Build sort options
    let sortOptions = {};
    switch (sortBy) {
      case "newest":
        sortOptions = { createdAt: -1 };
        break;
      case "oldest":
        sortOptions = { createdAt: 1 };
        break;
      case "amount-high":
        sortOptions = { amount: -1 };
        break;
      case "amount-low":
        sortOptions = { amount: 1 };
        break;
      default:
        sortOptions = { createdAt: -1 };
    }

    // Get orders with pagination
    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      Order.find(query).sort(sortOptions).skip(skip).limit(limit).populate({
        path: "items.bookId",
        model: "Book",
        select: "title coverImage price",
      }),
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
          delivered: {
            $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] },
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
          delivered: 0,
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

    // Connect to database
    await connect();

    const body = await req.json();
    const { action, orderIds, orderId, status } = body;

    // Handle single order update
    if (orderId && status) {
      const order = await Order.findById(orderId);
      if (!order) {
        return new Response(JSON.stringify({ error: "Order not found" }), {
          status: 404,
        });
      }

      // Add tracking update
      const trackingUpdate = {
        status,
        message: `Order status updated to ${status}`,
        timestamp: new Date(),
      };

      order.tracking.push(trackingUpdate);
      order.status = status;

      // Send email notification
      try {
        const emailTemplate = buildOrderEmailTemplate({
          orderId: order._id,
          buyerName: order.buyerName,
          orderDate: order.createdAt,
          totalAmount: order.amount,
          paymentStatus: order.paymentStatus,
          paymentMethod: order.paymentMethod,
          deliveryAddress: order.deliveryAddress,
          items: order.items,
          type: "update",
        });

        await fetch(process.env.URL + "/api/emails", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: order.buyerEmail,
            subject: emailTemplate.subject,
            html: emailTemplate.html,
          }),
        });
      } catch (error) {
        console.error("Failed to send email notification:", error);
      }

      await order.save();

      return new Response(
        JSON.stringify({
          success: true,
          message: "Order updated successfully",
          order,
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Handle bulk actions
    if (!action || !orderIds || !Array.isArray(orderIds)) {
      return new Response(
        JSON.stringify({ error: "Invalid request parameters" }),
        { status: 400 }
      );
    }

    let newStatus;
    switch (action) {
      case "mark-processing":
        newStatus = "processing";
        break;
      case "mark-delivery":
        newStatus = "delivery";
        break;
      case "mark-delivered":
        newStatus = "delivered";
        break;
      case "mark-completed":
        newStatus = "completed";
        break;
      case "mark-cancelled":
        newStatus = "cancelled";
        break;
      case "mark-failed":
        newStatus = "failed";
        break;
      case "delete":
        // Delete orders
        const deleteResult = await Order.deleteMany({ _id: { $in: orderIds } });
        return new Response(
          JSON.stringify({
            success: true,
            message: `Successfully deleted ${deleteResult.deletedCount} orders`,
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      default:
        return new Response(JSON.stringify({ error: "Invalid action" }), {
          status: 400,
        });
    }

    // Add tracking update
    const trackingUpdate = {
      status: newStatus,
      message: `Order status updated to ${newStatus}`,
      timestamp: new Date(),
    };

    // Update orders
    const result = await Order.updateMany(
      { _id: { $in: orderIds } },
      {
        $set: { status: newStatus },
        $push: { tracking: trackingUpdate },
      }
    );

    // Send email notifications for status changes
    if (newStatus) {
      const orders = await Order.find({ _id: { $in: orderIds } });
      for (const order of orders) {
        try {
          const emailTemplate = buildOrderEmailTemplate({
            orderId: order._id,
            buyerName: order.buyerName,
            orderDate: order.createdAt,
            totalAmount: order.amount,
            paymentStatus: order.paymentStatus,
            paymentMethod: order.paymentMethod,
            deliveryAddress: order.deliveryAddress,
            items: order.items,
            type: "update",
          });

          await fetch(`${process.env.URL}/api/emails`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: order.buyerEmail,
              subject: emailTemplate.subject,
              html: emailTemplate.html,
            }),
          });
        } catch (error) {
          console.error("Failed to send email notification:", error);
        }
      }
    }

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
