// src/app/api/orders/ssl-success/route.js
import { connect } from "@/lib/mongodb/mongoose";
import Order from "@/lib/models/Order";

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      tran_id,
      status,
      error,
      value_a, // orderId
    } = body;

    // Connect to database
    await connect();

    // Find and update order
    const order = await Order.findOne({ _id: value_a });
    if (!order) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
      });
    }

    // Update order status
    order.paymentStatus = "Failed";
    order.status = "failed";
    order.paymentDetails = {
      transactionId: tran_id,
      status,
      error,
      failedAt: new Date(),
    };

    // Add tracking update
    order.tracking.push({
      status: "failed",
      message: `Payment failed: ${error || "Unknown error"}`,
      timestamp: new Date(),
    });

    await order.save();

    // Return error response
    return new Response(
      JSON.stringify({
        status: "error",
        message: "Payment failed",
        orderId: order._id,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error processing failed payment:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  }
}
