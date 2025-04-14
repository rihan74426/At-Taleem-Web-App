// src/app/api/orders/[id]/route.js
import { connect } from "@/lib/mongodb/mongoose";
import Order from "@/lib/models/Order";

export async function GET(req, { params }) {
  await connect();
  const order = await Order.findById(params.id);
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
