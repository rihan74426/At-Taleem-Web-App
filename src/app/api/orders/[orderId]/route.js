import { connect } from "@/lib/mongodb";
import Order from "@/lib/models/Order";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});

export async function GET(req, { params }) {
  try {
    // Rate limiting
    const { success } = await limiter.check(5); // 5 requests per minute
    if (!success) {
      return new Response(JSON.stringify({ error: "Too many requests" }), {
        status: 429,
      });
    }

    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    // Connect to database
    await connect();

    // Get order details
    const order = await Order.findOne({
      orderId: params.orderId,
      userId: session.user.id,
    }).populate("items.book");

    if (!order) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
      });
    }

    // Return order details
    return new Response(JSON.stringify(order), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error fetching order details:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  }
}

export async function PATCH(req, { params }) {
  try {
    // Rate limiting
    const { success } = await limiter.check(5); // 5 requests per minute
    if (!success) {
      return new Response(JSON.stringify({ error: "Too many requests" }), {
        status: 429,
      });
    }

    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    // Connect to database
    await connect();

    // Get order
    const order = await Order.findOne({
      orderId: params.orderId,
      userId: session.user.id,
    });

    if (!order) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
      });
    }

    // Parse request body
    const body = await req.json();
    const { status, message, location } = body;

    // Validate status
    const validStatuses = [
      "pending",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
      "failed",
    ];
    if (status && !validStatuses.includes(status)) {
      return new Response(JSON.stringify({ error: "Invalid status" }), {
        status: 400,
      });
    }

    // Update order
    if (status) {
      order.status = status;
      order.tracking.push({
        status,
        message: message || `Order ${status}`,
        location,
        timestamp: new Date(),
      });
    }

    await order.save();

    // Return updated order
    return new Response(JSON.stringify(order), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error updating order:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  }
}
