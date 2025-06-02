// src/app/api/orders/[id]/route.js
import { connect } from "@/lib/mongodb/mongoose";
import Order from "@/lib/models/Order";
import { rateLimit } from "@/lib/rate-limit";
import { getAuth } from "@clerk/nextjs/server";
import { buildOrderEmailTemplate } from "@/app/utils/emailTemplates";

// Rate limiter: 10 requests per minute
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});

export async function GET(req, { params }) {
  await connect();
  const order = await Order.findById(params.id).populate({
    path: "items.bookId",
    model: "Book",
    select: "title coverImage price",
  });
  if (!order) {
    return new Response(JSON.stringify({ error: "Order not found" }), {
      status: 404,
    });
  }
  return new Response(JSON.stringify({ order }), {
    headers: { "Content-Type": "application/json" },
  });
}

export async function PUT(req, { params }) {
  await connect();
  const updates = await req.json();
  // only allow certain fields
  const allowed = ["status", "deliveryAddress", "deliveryPhone"];
  const data = {};
  for (const key of allowed) {
    if (updates[key] !== undefined) data[key] = updates[key];
  }
  const order = await Order.findByIdAndUpdate(params.id, data, { new: true });
  if (!order) {
    return new Response(JSON.stringify({ error: "Order not found" }), {
      status: 404,
    });
  }
  return new Response(JSON.stringify({ order }), {
    headers: { "Content-Type": "application/json" },
  });
}

export async function DELETE(req, { params }) {
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

    const { id } = params;

    // Find and delete the order
    const order = await Order.findByIdAndDelete(id);
    if (!order) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Order deleted successfully",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error in order deletion API:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  }
}

export async function PATCH(req, { params }) {
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

    const { id } = params;
    const updates = await req.json();

    // Find the order
    const order = await Order.findById(id);
    if (!order) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
      });
    }

    // If status is being updated
    if (updates.status && updates.status !== order.status) {
      // Add tracking update
      const trackingUpdate = {
        status: updates.status,
        message: `Order status updated to ${updates.status}`,
        timestamp: new Date(),
      };

      order.tracking.push(trackingUpdate);
      order.status = updates.status;

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

    // Update other fields
    Object.keys(updates).forEach((key) => {
      if (key !== "status") {
        order[key] = updates[key];
      }
    });

    await order.save();

    return new Response(
      JSON.stringify({
        success: true,
        message: `Order ${
          updates.status ? `status updated to ${updates.status}` : "updated"
        } successfully`,
        order,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error in order update API:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  }
}
