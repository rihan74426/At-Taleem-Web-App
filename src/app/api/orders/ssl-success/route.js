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

    // Find and update order
    const order = await Order.findOne({ orderId: value_a });
    if (!order) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
      });
    }

    // Update order status
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
      message: "Payment successful. Order is being processed.",
      timestamp: new Date(),
    });

    await order.save();

    // Return success response
    return new Response(
      JSON.stringify({
        status: "success",
        message: "Payment processed successfully",
        orderId: order.orderId,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error processing successful payment:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  }
}
