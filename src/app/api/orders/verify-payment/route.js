// src/app/api/orders/verify-payment/route.js
import { connect } from "@/lib/mongodb/mongoose";
import Order from "@/lib/models/Order";
import { rateLimit } from "@/lib/rate-limit";
import { getAuth } from "@clerk/nextjs/server";

// Rate‐limiting config: 5 requests per minute
const limiter = rateLimit({
  interval: 60 * 1000,
  uniqueTokenPerInterval: 500, // etc.
});

export async function POST(req) {
  try {
    // 1) Rate-limit
    await limiter.check(5);

    // 2) Auth check
    const session = getAuth(req);
    if (!session) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    // 3) Connect DB
    await connect();

    // 4) Parse and validate body
    const { transactionId, orderId } = await req.json();
    if (!transactionId || !orderId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400 }
      );
    }

    // 5) Find that specific Order for this user
    const order = await Order.findOne({
      _id: orderId,
      userId: session.user.id,
    });
    if (!order) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
      });
    }

    // 6) Verify payment with gateway
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

    // 7) Update order
    order.paymentStatus = "Paid";
    order.status = "delivery";
    await order.save();

    // 8) (Optional) send confirmation email
    await sendOrderConfirmationEmail(order);

    return new Response(
      JSON.stringify({ success: true, message: "Payment verified" }),
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

async function verifyPaymentWithGateway(transactionId, order) {
  try {
    const resp = await fetch(
      `https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php?val_id=${transactionId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    if (!resp.ok) {
      throw new Error("Payment gateway verification failed");
    }
    const data = await resp.json();

    // 1) Check amount
    if (parseFloat(data.amount) !== order.amount) {
      throw new Error("Amount mismatch");
    }
    // 2) Check status
    return data.status === "VALID";
  } catch (err) {
    console.error("Payment gateway verification error:", err);
    return false;
  }
}

async function sendOrderConfirmationEmail(order) {
  try {
    // Use nodemailer or other to email the user.confirmation.
    console.log("Send confirmation email to:", order.buyerEmail);
    // ...
  } catch (err) {
    console.error("Failed to send confirmation email:", err);
  }
}
