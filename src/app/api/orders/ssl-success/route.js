import { connect } from "@/lib/mongodb/mongoose";
import Order from "@/lib/models/Order";

export async function POST(req) {
  await connect();

  // SSLCommerz sends form-encoded data
  const form = await req.formData();
  const tranId = form.get("tran_id"); // your order._id
  const status = form.get("status"); // e.g. "VALID" or "FAILED"

  // 1) Load the order
  const order = await Order.findById(tranId);
  if (!order) {
    return new Response("Order not found", { status: 404 });
  }

  // 2) If status is VALID (or whatever indicates success), mark paid
  if (status === "VALID" || status === "VALIDATED") {
    order.paymentStatus = "delivery";
    order.status = "paid"; // if you also track that
    await order.save();
    // 3) Redirect user to a thank‑you page
    return new Response(null, {
      status: 302,
      headers: { Location: `/orders/${order._id}/thank-you` },
    });
  } else {
    // mark failed
    order.paymentStatus = "Unpaid";
    order.status = "failed";
    await order.save();
    return new Response(null, {
      status: 302,
      headers: { Location: `/orders/${order._id}/payment-failed` },
    });
  }
}
