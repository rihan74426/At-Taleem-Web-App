import { connect } from "@/lib/mongodb/mongoose";
import Order from "@/lib/models/Order";
import { buildOrderEmailTemplate } from "@/app/utils/emailTemplates";
import { clerkClient } from "@clerk/nextjs/server";

// Validate required SSL parameters
const validateSSLParams = (formData) => {
  const requiredFields = [
    "tran_id",
    "val_id",
    "amount",
    "store_amount",
    "currency",
    "value_a",
  ];

  const missingFields = requiredFields.filter((field) => !formData.get(field));
  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
  }

  return {
    tranId: formData.get("tran_id"),
    valId: formData.get("val_id"),
    amount: parseFloat(formData.get("amount")),
    storeAmount: parseFloat(formData.get("store_amount")),
    currency: formData.get("currency"),
    bankTranId: formData.get("bank_tran_id"),
    cardType: formData.get("card_type"),
    cardNo: formData.get("card_no"),
    cardIssuer: formData.get("card_issuer"),
    cardBrand: formData.get("card_brand"),
    cardSubBrand: formData.get("card_sub_brand"),
    cardCategory: formData.get("card_category"),
    cardIssuerCountry: formData.get("card_issuer_country"),
    cardIssuerCountryCode: formData.get("card_issuer_country_code"),
    baseFair: parseFloat(formData.get("base_fair") || "0"),
    valueA: formData.get("value_a"),
    riskLevel: formData.get("risk_level"),
    riskTitle: formData.get("risk_title"),
  };
};

// Send email using the email API
const sendEmail = async (to, subject, html) => {
  try {
    const response = await fetch(`${process.env.URL}/api/emails`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, subject, html }),
    });

    if (!response.ok) {
      throw new Error(`Email API responded with status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Email sending failed:", error);
    // Don't throw the error as email failure shouldn't block the order process
    return null;
  }
};

// Get admin emails from Clerk
const getAdminEmails = async () => {
  try {
    const admins = (await clerkClient().users.getUserList()).data.filter(
      (user) => user.publicMetadata.isAdmin
    );
    return admins
      .flatMap((u) => u.emailAddresses.map((e) => e.emailAddress))
      .filter(Boolean);
  } catch (error) {
    console.error("Failed to fetch admin emails:", error);
    return [];
  }
};

export async function POST(req) {
  try {
    // Connect to MongoDB
    await connect();

    // Parse and validate form data
    const formData = await req.formData();
    const sslParams = validateSSLParams(formData);

    // Parse order data from value_a
    let orderData;
    try {
      orderData = JSON.parse(sslParams.valueA);
    } catch (error) {
      throw new Error("Invalid order data format", error);
    }

    // Create order with payment details
    const order = await Order.create({
      ...orderData,
      amount: sslParams.amount,
      paymentStatus: "Paid",
      paymentDetails: {
        transactionId: sslParams.tranId,
        validationId: sslParams.valId,
        amount: sslParams.amount,
        paidAt: new Date(),
        cardType: sslParams.cardType,
        cardNo: sslParams.cardNo,
        cardIssuer: sslParams.cardIssuer,
        cardBrand: sslParams.cardBrand,
        cardSubBrand: sslParams.cardSubBrand,
        cardCategory: sslParams.cardCategory,
        cardIssuerCountry: sslParams.cardIssuerCountry,
        cardIssuerCountryCode: sslParams.cardIssuerCountryCode,
        bankTranId: sslParams.bankTranId,
        currency: sslParams.currency,
        storeAmount: sslParams.storeAmount,
        baseFair: sslParams.baseFair,
        riskLevel: sslParams.riskLevel,
        riskTitle: sslParams.riskTitle,
      },
    });

    // Prepare email templates
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

    // Send emails in parallel
    const [customerEmailResult, adminEmails] = await Promise.all([
      sendEmail(
        order.buyerEmail,
        customerEmailTemplate.subject,
        customerEmailTemplate.html
      ),
      getAdminEmails(),
    ]);

    // Send admin notification if admin emails are available
    if (adminEmails.length > 0) {
      await sendEmail(
        adminEmails,
        adminEmailTemplate.subject,
        adminEmailTemplate.html
      );
    }

    // Redirect to success page
    return Response.redirect(`${process.env.URL}/order-success/${order._id}`);
  } catch (error) {
    console.error("SSL Success Error:", error);

    // Log detailed error information
    console.error({
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });

    // Redirect to failure page with error message
    return Response.redirect(
      `${process.env.URL}/order-failed?error=${encodeURIComponent(
        error.message || "Payment processing failed"
      )}`
    );
  }
}
