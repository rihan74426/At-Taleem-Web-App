import { connect } from "@/lib/mongodb/mongoose";
import Order from "@/lib/models/Order";
import { rateLimit } from "@/lib/rate-limit";
import { getAuth } from "@clerk/nextjs/server";

// Rate limiting configuration
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});

export async function POST(req) {
  try {
    // Rate limiting
    await limiter.check(5); // 5 requests per minute

    // Authentication check
    const session = getAuth(req);
    if (!session) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    // Connect to database
    await connect();

    // Parse and validate request body
    const { transactionId, orderId } = await req.json();
    if (!transactionId || !orderId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400 }
      );
    }

    // Find and validate order
    const order = await Order.findOne({
      _id: orderId,
      userId: session.user.id,
    });

    if (!order) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
      });
    }

    // Verify payment with payment gateway
    const paymentVerified = await verifyPaymentWithGateway(
      transactionId,
      order
    );
    if (!paymentVerified) {
      return new Response(
        JSON.stringify({ error: "Payment verification failed" }),
        { status: 400 }
      );
    }

    // Update order status
    order.paymentStatus = "Paid";
    order.status = "delivery";
    await order.save();

    // Send confirmation email
    await sendOrderConfirmationEmail(order);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Payment verified successfully",
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Payment verification error:", error);

    if (error.code === "RATE_LIMIT_EXCEEDED") {
      return new Response(JSON.stringify({ error: "Too many requests" }), {
        status: 429,
      });
    }

    return new Response(
      JSON.stringify({
        error: "Payment verification failed",
        message: error.message,
      }),
      { status: 500 }
    );
  }
}

// Helper function to verify payment with gateway
async function verifyPaymentWithGateway(transactionId, order) {
  try {
    const response = await fetch(
      `https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php?val_id=${transactionId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Payment gateway verification failed");
    }

    const data = await response.json();

    // Verify amount matches
    if (parseFloat(data.amount) !== order.amount) {
      throw new Error("Payment amount mismatch");
    }

    // Verify transaction status
    return data.status === "VALID";
  } catch (error) {
    console.error("Payment gateway verification error:", error);
    return false;
  }
}

// Helper function to send confirmation email
async function sendOrderConfirmationEmail(order) {
  try {
    // Implement email sending logic here
    // You can use nodemailer or any other email service
    console.log("Sending confirmation email to:", order.buyerEmail);
  } catch (error) {
    console.error("Failed to send confirmation email:", error);
  }
}
