import { connect } from "@/lib/mongodb/mongoose";
import Order from "@/lib/models/Order";
import { buildOrderEmailTemplate } from "@/app/utils/emailTemplates";

// Remove authentication middleware for SSL callback
export const dynamic = "force-dynamic";
export const runtime = "edge";

export async function POST(req) {
  try {
    await connect();
    const formData = await req.formData();
    const tranId = formData.get("tran_id");
    const valId = formData.get("val_id");
    const amount = formData.get("amount");
    const storeAmount = formData.get("store_amount");
    const currency = formData.get("currency");
    const bankTranId = formData.get("bank_tran_id");
    const cardType = formData.get("card_type");
    const cardNo = formData.get("card_no");
    const cardIssuer = formData.get("card_issuer");
    const cardBrand = formData.get("card_brand");
    const cardSubBrand = formData.get("card_sub_brand");
    const cardCategory = formData.get("card_category");
    const cardIssuerCountry = formData.get("card_issuer_country");
    const cardIssuerCountryCode = formData.get("card_issuer_country_code");
    const baseFair = formData.get("base_fair");
    const valueA = formData.get("value_a");
    const riskLevel = formData.get("risk_level");
    const riskTitle = formData.get("risk_title");

    // Parse order data from value_a
    const orderData = JSON.parse(valueA);

    // Create order with payment details
    const order = await Order.create({
      ...orderData,
      amount: parseFloat(amount),
      paymentStatus: "Paid",
      paymentDetails: {
        transactionId: tranId,
        validationId: valId,
        amount: parseFloat(amount),
        paidAt: new Date(),
        cardType,
        cardNo,
        cardIssuer,
        cardBrand,
        cardSubBrand,
        cardCategory,
        cardIssuerCountry,
        cardIssuerCountryCode,
        bankTranId,
        currency,
        storeAmount: parseFloat(storeAmount),
        baseFair: parseFloat(baseFair),
        riskLevel,
        riskTitle,
      },
    });

    // Send confirmation email to customer
    const customerEmailTemplate = buildOrderEmailTemplate({
      orderId: order._id,
      buyerName: order.buyerName,
      orderDate: new Date(order.createdAt).toLocaleDateString(),
      totalAmount: order.amount,
      paymentStatus: order.paymentStatus,
      deliveryAddress: order.deliveryAddress,
      items: order.items,
      type: "confirmation",
    });

    await fetch(`${process.env.URL}/api/emails`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: order.buyerEmail,
        subject: customerEmailTemplate.subject,
        html: customerEmailTemplate.html,
      }),
    });

    // Send notification email to admin
    const adminEmailTemplate = buildOrderEmailTemplate({
      orderId: order._id,
      buyerName: order.buyerName,
      orderDate: new Date(order.createdAt).toLocaleDateString(),
      totalAmount: order.amount,
      paymentStatus: order.paymentStatus,
      deliveryAddress: order.deliveryAddress,
      items: order.items,
      type: "admin_notification",
    });

    await fetch(`${process.env.URL}/api/emails`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: process.env.ADMIN_EMAIL,
        subject: adminEmailTemplate.subject,
        html: adminEmailTemplate.html,
      }),
    });

    // Redirect to success page
    return Response.redirect(`${process.env.URL}/order-success/${order._id}`);
  } catch (error) {
    console.error("SSL Success Error:", error);
    return Response.redirect(
      `${process.env.URL}/order-failed?error=${encodeURIComponent(
        "Payment processing failed"
      )}`
    );
  }
}
