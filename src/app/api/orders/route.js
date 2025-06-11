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

  const orders = await Order.find(filter)
    .populate({
      path: "items.bookId",
      model: "Book",
      select: "title coverImage price",
    })
    .sort({ createdAt: -1 });
  return new Response(JSON.stringify({ orders }), {
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(req) {
  await connect();
  const {
    items,
    userId,
    buyerName,
    buyerEmail,
    deliveryAddress,
    deliveryPhone,
    bundlePrice, // optional
  } = await req.json();

  if (
    !Array.isArray(items) ||
    items.length === 0 ||
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
  const bookIds = items.map((i) => i.bookId);
  const books = await Book.find({ _id: { $in: bookIds } });
  if (books.length !== bookIds.length) {
    return new Response(JSON.stringify({ error: "Some books not found" }), {
      status: 404,
    });
  }

  // Compute total = sum(book.price * qty)
  const totalAmount = bundlePrice
    ? bundlePrice
    : items.reduce((sum, { bookId, qty }) => {
        const b = books.find((x) => x._id.toString() === bookId);
        return sum + b.price * qty;
      }, 0);

  // Prepare SSLCommerz payload
  const storeId = process.env.SSLCZ_STORE_ID;
  const storePasswd = process.env.SSLCZ_STORE_PASSWORD;
  const successUrl = `${process.env.URL}/api/orders/ssl-success`;
  const failUrl = `${process.env.URL}/api/orders/ssl-fail`;
  const cancelUrl = `${process.env.URL}/api/orders/ssl-cancel`;

  const formBody = new URLSearchParams({
    store_id: storeId,
    store_passwd: storePasswd,
    total_amount: totalAmount.toString(),
    currency: "BDT",
    tran_id: `ORDER_${Date.now()}`, // Temporary transaction ID
    success_url: successUrl,
    fail_url: failUrl,
    cancel_url: cancelUrl,
    cus_name: buyerName,
    cus_email: buyerEmail,
    cus_phone: deliveryPhone,
    cus_add1: deliveryAddress,
    cus_city: "Dhaka",
    cus_postcode: "4000",
    cus_country: "Bangladesh",
    shipping_method: "No",
    product_name: books.map((b) => b.title).join(", "),
    product_category: "Books",
    product_profile: "Physical-goods",
    emi_option: "0",
    value_a: JSON.stringify({
      items,
      userId,
      buyerName,
      buyerEmail,
      deliveryAddress,
      deliveryPhone,
      bundlePrice,
    }), // Store order data
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
    return new Response(
      JSON.stringify({
        paymentUrl: data.GatewayPageURL,
        sessionKey: data.sessionkey,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } else {
    return new Response(
      JSON.stringify({ error: "SSL init failed", detail: data }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
