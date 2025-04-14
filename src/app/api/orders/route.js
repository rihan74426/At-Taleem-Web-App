// src/app/api/orders/route.js
import { connect } from "@/lib/mongodb/mongoose";
import Order from "@/lib/models/Order";
import Book from "@/lib/models/Book";

export async function GET(req) {
  await connect();
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId"); // optional filter

  const filter = {};
  if (userId) filter.userId = userId;

  const orders = await Order.find(filter).sort({ createdAt: -1 });
  return new Response(JSON.stringify({ orders }), {
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(req) {
  await connect();
  const {
    bookIds,
    userId,
    buyerName,
    buyerEmail,
    deliveryAddress,
    deliveryPhone,
  } = await req.json();

  if (
    !Array.isArray(bookIds) ||
    bookIds.length === 0 ||
    !userId ||
    !buyerName ||
    !buyerEmail ||
    !deliveryAddress ||
    !deliveryPhone
  ) {
    return new Response(JSON.stringify({ error: "Missing fields" }), {
      status: 400,
    });
  }

  // Fetch all books and compute total
  const books = await Book.find({ _id: { $in: bookIds } });
  if (books.length !== bookIds.length) {
    return new Response(
      JSON.stringify({ error: "One or more books not found" }),
      {
        status: 404,
      }
    );
  }
  const totalAmount = books.reduce((sum, b) => sum + b.price, 0);

  // create order
  const order = await Order.create({
    bookIds,
    userId,
    buyerName,
    buyerEmail,
    deliveryAddress,
    deliveryPhone,
    amount: totalAmount,
  });

  // Prepare SSLCommerz payload
  const storeId = process.env.SSLCZ_STORE_ID;
  const storePasswd = process.env.SSLCZ_STORE_PASSWORD;
  const successUrl = `${process.env.URL}/api/orders/ssl-success`;
  const failUrl = `${process.env.URL}/api/orders/ssl-fail`;

  const formBody = new URLSearchParams({
    store_id: storeId,
    store_passwd: storePasswd,
    total_amount: totalAmount.toString(),
    currency: "BDT",
    tran_id: order._id.toString(),
    success_url: successUrl,
    fail_url: failUrl,
    cus_name: buyerName,
    cus_email: buyerEmail,
    cus_phone: deliveryPhone,
    cus_add1: deliveryAddress,
    cus_city: deliveryAddress,
    cus_postcode: "4000",
    cus_country: "Bangladesh",
    shipping_method: "No",
    product_name: books.map((b) => b.title).join(", "),
    product_category: "Books",
    product_profile: "Physical-goods",
    emi_option: "0",
    value_a: order._id.toString(),
  });

  // Call SSLCommerz init API
  const resp = await fetch(
    "https://sandbox.sslcommerz.com/gwprocess/v4/api.php",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formBody.toString(),
    }
  );
  const data = await resp.json();
  if (data.GatewayPageURL) {
    order.sessionKey = data.sessionkey;
    order.gatewayPageURL = data.GatewayPageURL;
    await order.save();
    return new Response(JSON.stringify({ paymentUrl: data.GatewayPageURL }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } else {
    return new Response(
      JSON.stringify({ error: "SSL init failed", detail: data }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
