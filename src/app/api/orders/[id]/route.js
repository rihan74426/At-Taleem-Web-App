// src/app/api/orders/[id]/route.js
import { connect } from "@/lib/mongodb/mongoose";
import Order from "@/lib/models/Order";
import { buildOrderEmailTemplate } from "@/app/utils/emailTemplates";

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

export async function PATCH(req, { params }) {
  await connect();
  const { id } = params;
  const updates = await req.json();

  const order = await Order.findById(id);
  if (!order) {
    return new Response(JSON.stringify({ error: "Order not found" }), {
      status: 404,
    });
  }

  // Update order
  Object.assign(order, updates);
  await order.save();

  // Send status update email if status changed
  if (updates.status && updates.status !== order.status) {
    const emailTemplate = buildOrderEmailTemplate({
      orderId: order._id,
      buyerName: order.buyerName,
      orderDate: new Date(order.createdAt).toLocaleDateString(),
      totalAmount: order.amount,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod || "SSLCommerz",
      deliveryAddress: order.deliveryAddress,
      items: order.items.map((item) => ({
        title: item.bookId?.title || "Book",
        coverImage: item.bookId?.coverImage || "",
        qty: item.qty,
        price: item.price,
      })),
      type: updates.status === "delivery" ? "shipping" : "update",
    });

    // Send email
    await fetch(`${process.env.URL}/api/emails`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: order.buyerEmail,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
      }),
    });
  }

  return new Response(JSON.stringify({ order }), {
    headers: { "Content-Type": "application/json" },
  });
}
