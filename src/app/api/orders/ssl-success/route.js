// src/app/api/orders/ssl-success/route.js
import { connect } from "@/lib/mongodb/mongoose";
import Order from "@/lib/models/Order";

export async function POST(req) {
  await connect();
  const form = await req.formData();
  const tran_id = form.get("tran_id"); // your order._id
  const val_id = form.get("val_id"); // validation id
  const status = form.get("status"); // "VALID" or so

  const order = await Order.findById(tran_id);
  if (!order) return new Response("Order not found", { status: 404 });

  if (status === "VALID") {
    order.status = "paid";
    await order.save();
    // you could redirect to a “thank you” page
    return new Response(null, {
      status: 302,
      headers: { Location: `/orders/${order._id}/thank-you` },
    });
  } else {
    order.status = "failed";
    await order.save();
    return new Response(null, {
      status: 302,
      headers: { Location: `/orders/${order._id}/failed` },
    });
  }
}

// src/app/api/orders/ssl-fail/route.js
