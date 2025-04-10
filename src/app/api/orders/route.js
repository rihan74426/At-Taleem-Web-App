// src/app/api/orders/route.js
import { connect } from "@/lib/mongodb/mongoose";
import Order from "@/lib/models/Order";
import Book from "@/lib/models/Book";

export async function POST(req) {
  await connect();
  const { bookId, userId, buyerName, buyerEmail, paymentMethod } =
    await req.json();

  if (!bookId || !userId || !buyerName || !buyerEmail) {
    return new Response(JSON.stringify({ error: "Missing fields" }), {
      status: 400,
    });
  }

  // load book to get price
  const book = await Book.findById(bookId);
  if (!book) {
    return new Response(JSON.stringify({ error: "Book not found" }), {
      status: 404,
    });
  }

  // create order
  const order = await Order.create({
    bookId,
    userId,
    buyerName,
    buyerEmail,
    amount: book.price,
    method: paymentMethod,
  });

  // Prepare payload for SSLCommerz
  const storeId = process.env.SSLCZ_STORE_ID;
  const storePasswd = process.env.SSLCZ_STORE_PASSWORD;
  const successUrl = `${process.env.APP_URL}/api/orders/ssl-success`;
  const failUrl = `${process.env.APP_URL}/api/orders/ssl-fail`;
  const payload = {
    store_id: storeId,
    store_passwd: storePasswd,
    total_amount: book.price,
    currency: "BDT",
    tran_id: order._id.toString(), // use order id as tran_id
    success_url: successUrl,
    fail_url: failUrl,
    cus_name: buyerName,
    cus_email: buyerEmail,
    product_name: book.title,
    value_a: order._id.toString(), // pass order id back
  };

  // Call SSLCommerz init API
  const response = await fetch(
    "https://sandbox.sslcommerz.com/gwprocess/v4/api.php",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );
  const data = await response.json();
  if (data.GatewayPageURL) {
    // save sessionKey & URL
    order.sessionKey = data.sessionkey;
    order.gatewayPageURL = data.GatewayPageURL;
    await order.save();
    return new Response(JSON.stringify({ paymentUrl: data.GatewayPageURL }), {
      status: 200,
    });
  } else {
    return new Response(
      JSON.stringify({ error: "SSLCommerz init failed", detail: data }),
      { status: 500 }
    );
  }
}
