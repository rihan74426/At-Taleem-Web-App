import { connect } from "@/lib/mongodb/mongoose";
import Order from "@/lib/models/Order";

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      tran_id,
      value_a, // orderId
    } = body;

    // Connect to database
    await connect();

    // Find and update order
    const order = await Order.findOne({ orderId: value_a });
    if (!order) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
      });
    }

    // Update order status
    order.paymentStatus = "Unpaid";
    order.status = "cancelled";
    order.paymentDetails = {
      transactionId: tran_id,
      cancelledAt: new Date(),
    };

    // Add tracking update
    order.tracking.push({
      status: "cancelled",
      message: "Payment cancelled by user",
      timestamp: new Date(),
    });

    await order.save();

    // Return response
    return new Response(
      JSON.stringify({
        status: "cancelled",
        message: "Payment cancelled",
        orderId: order.orderId,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error processing cancelled payment:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  }
}
