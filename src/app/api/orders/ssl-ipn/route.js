import { connect } from "@/lib/mongodb/mongoose";
import Order from "@/lib/models/Order";

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      tran_id,
      status,
      val_id,
      amount,
      store_amount,
      currency,
      bank_tran_id,
      card_type,
      card_no,
      card_issuer,
      card_brand,
      card_issuer_country,
      card_issuer_country_code,
      currency_type,
      currency_amount,
      currency_rate,
      base_fair,
      value_a, // orderId
      value_b, // userId
      value_c, // paymentMethod
      value_d, // paymentType
    } = body;

    // Connect to database
    await connect();

    // Find order
    const order = await Order.findOne({ orderId: value_a });
    if (!order) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
      });
    }

    // Verify payment status
    if (status === "VALID") {
      // Update order status if not already paid
      if (order.paymentStatus !== "Paid") {
        order.paymentStatus = "Paid";
        order.status = "processing";
        order.paymentDetails = {
          transactionId: tran_id,
          validationId: val_id,
          amount: amount,
          storeAmount: store_amount,
          currency: currency,
          bankTransactionId: bank_tran_id,
          cardType: card_type,
          cardNumber: card_no,
          cardIssuer: card_issuer,
          cardBrand: card_brand,
          cardIssuerCountry: card_issuer_country,
          cardIssuerCountryCode: card_issuer_country_code,
          currencyType: currency_type,
          currencyAmount: currency_amount,
          currencyRate: currency_rate,
          baseFair: base_fair,
          paidAt: new Date(),
        };

        // Add tracking update
        order.tracking.push({
          status: "processing",
          message: "Payment confirmed via IPN. Order is being processed.",
          timestamp: new Date(),
        });

        await order.save();
      }
    } else {
      // Update order status if payment failed
      if (order.paymentStatus !== "Failed") {
        order.paymentStatus = "Failed";
        order.status = "failed";
        order.paymentDetails = {
          transactionId: tran_id,
          status,
          failedAt: new Date(),
        };

        // Add tracking update
        order.tracking.push({
          status: "failed",
          message: "Payment failed via IPN",
          timestamp: new Date(),
        });

        await order.save();
      }
    }

    // Return success response
    return new Response(
      JSON.stringify({
        status: "success",
        message: "IPN processed successfully",
        orderId: order._id,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error processing IPN:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  }
}
