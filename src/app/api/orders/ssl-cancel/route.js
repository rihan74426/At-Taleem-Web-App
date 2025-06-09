import { connect } from "@/lib/mongodb/mongoose";
import Order from "@/lib/models/Order";
import { buildOrderEmailTemplate } from "@/app/utils/emailTemplates";

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
    const order = await Order.findById(value_a).populate({
      path: "items.bookId",
      model: "Book",
      select: "title coverImage price",
    });

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

    // Send payment cancellation email
    try {
      const emailTemplate = buildOrderEmailTemplate({
        orderId: order._id,
        buyerName: order.buyerName,
        orderDate: order.createdAt,
        totalAmount: order.amount,
        paymentStatus: order.paymentStatus,
        deliveryAddress: order.deliveryAddress,
        items: order.items.map((item) => ({
          title: item.bookId.title,
          coverImage: item.bookId.coverImage,
          qty: item.qty,
          price: item.price,
        })),
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
      console.error("Failed to send payment cancellation email:", error);
    }

    // Return response
    return new Response(
      JSON.stringify({
        status: "cancelled",
        message: "Payment cancelled",
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
    console.error("Error processing cancelled payment:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  }
}
