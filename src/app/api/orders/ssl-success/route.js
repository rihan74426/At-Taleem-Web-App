import { connect } from "@/lib/mongodb/mongoose";
import Order from "@/lib/models/Order";
import { buildOrderEmailTemplate } from "@/app/utils/emailTemplates";

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
    } = body;

    // Connect to database
    await connect();

    // Find and update order
    const order = await Order.findById(value_a).populate({
      path: "items.bookId",
      model: "Book",
      select: "title coverImage price",
    });

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

    // Send payment confirmation email
    try {
      const emailTemplate = buildOrderEmailTemplate({
        orderId: order._id,
        buyerName: order.buyerName,
        orderDate: order.createdAt,
        totalAmount: order.amount,
        paymentStatus: order.paymentStatus,
        deliveryAddress: order.deliveryAddress,
        items: order.items.map((item) => ({
          title: item.bookId.title,
          coverImage: item.bookId.coverImage,
          qty: item.qty,
          price: item.price,
        })),
        type: "confirmation",
      });

      await fetch(`${process.env.URL}/api/emails`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: order.buyerEmail,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
        }),
      });
    } catch (error) {
      console.error("Failed to send payment confirmation email:", error);
    }

    // Return success response
    return new Response(
      JSON.stringify({
        status: "success",
        message: "Payment processed successfully",
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
    console.error("Error processing successful payment:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  }
}
