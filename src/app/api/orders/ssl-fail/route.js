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
  order.status = "failed";
  await order.save();
  return new Response(null, {
    status: 302,
    headers: { Location: `/orders/${order._id}/failed` },
  });
}
