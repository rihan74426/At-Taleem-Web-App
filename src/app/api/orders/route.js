// src/app/api/orders/route.js
import { connect } from "@/lib/mongodb/mongoose";
import Order from "@/lib/models/Order";
import Book from "@/lib/models/Book";

export async function POST(req) {
  await connect();
  const {
    bookId,
    userId,
    buyerName,
    buyerEmail,
    deliveryAddress,
    deliveryPhone,
  } = await req.json();

  if (
    !bookId ||
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
    deliveryAddress,
    deliveryPhone,
  });

  // Prepare payload for SSLCommerz
  const storeId = process.env.SSLCZ_STORE_ID;
  const storePasswd = process.env.SSLCZ_STORE_PASSWORD;
  const successUrl = `${process.env.URL}/api/orders/ssl-success`;
  const failUrl = `${process.env.URL}/api/orders/ssl-fail`;

  const formBody = new URLSearchParams();
  formBody.append("store_id", storeId);
  formBody.append("store_passwd", storePasswd);
  formBody.append("total_amount", book.price.toString());
  formBody.append("currency", "BDT");
  formBody.append("tran_id", order._id.toString());
  formBody.append("success_url", successUrl);
  formBody.append("fail_url", failUrl);
  formBody.append("cus_name", buyerName);
  formBody.append("cus_email", buyerEmail);
  formBody.append("cus_phone", deliveryPhone);
  formBody.append("cus_add1", deliveryAddress);
  formBody.append("cus_city", deliveryAddress);
  formBody.append("cus_postcode", "4000");
  formBody.append("cus_country", "Bangladesh");
  formBody.append("shipping_method", "No");
  formBody.append("product_name", book.title);
  formBody.append("product_category", "Book");
  formBody.append("product_profile", "Physical-goods");
  formBody.append("emi_option", 0);
  formBody.append("value_a", order._id.toString());

  // Call SSLCommerz init API
  const response = await fetch(
    "https://sandbox.sslcommerz.com/gwprocess/v4/api.php",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body: formBody.toString(),
    }
  );

  const data = await response.json();
  console.log("SSL init response:", data);
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
