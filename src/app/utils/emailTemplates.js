export const buildOrderEmailTemplate = ({
  orderId,
  buyerName,
  orderDate,
  totalAmount,
  paymentStatus,
  deliveryAddress,
  items,
  type = "confirmation", // confirmation, update, shipping, etc.
}) => {
  // Validate required fields
  if (
    !orderId ||
    !buyerName ||
    !orderDate ||
    !totalAmount ||
    !paymentStatus ||
    !deliveryAddress ||
    !items
  ) {
    throw new Error("Missing required fields for email template");
  }

  // Validate items array
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Items must be a non-empty array");
  }

  // Validate each item has required fields
  items.forEach((item, index) => {
    if (!item.title || !item.coverImage || !item.qty || !item.price) {
      throw new Error(
        `Invalid item at index ${index}: missing required fields`
      );
    }
  });

  const getSubject = () => {
    switch (type) {
      case "confirmation":
        return `Order Confirmation - #${orderId}`;
      case "update":
        return `Order Update - #${orderId}`;
      case "shipping":
        return `Your Order #${orderId} is Shipped!`;
      default:
        return `Order #${orderId} Update`;
    }
  };

  const getHeader = () => {
    switch (type) {
      case "confirmation":
        return "Thank You for Your Order!";
      case "update":
        return "Order Status Update";
      case "shipping":
        return "Your Order is on the Way!";
      default:
        return "Order Update";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Paid":
        return "#00796b";
      case "Unpaid":
        return "#c62828";
      case "Refunded":
        return "#4527a0";
      case "Failed":
        return "#c62828";
      default:
        return "#263238";
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("bn-BD", {
      style: "currency",
      currency: "BDT",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Format date
  const formatDate = (date) => {
    return new Intl.DateTimeFormat("bn-BD", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  return {
    subject: getSubject(),
    html: `
<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${getSubject()}</title>
  <style>
    @media only screen and (max-width: 600px) {
      .email-container {
        width: 100% !important;
      }
      .email-content {
        padding: 20px !important;
      }
      .mobile-stack {
        display: block !important;
        width: 100% !important;
      }
      .item-image {
        width: 60px !important;
        height: 90px !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #eef2f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; font-size: 16px; line-height: 1.4; color: #333333;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table role="presentation" class="email-container" width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: #004d40; padding: 30px; text-align: center;">
              <img src="cid:logo" alt="At-Taleem Logo" width="120" height="auto" style="max-width: 120px; margin-bottom: 15px;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #ffffff;">${getHeader()}</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td class="email-content" style="padding: 30px; color: #333333;">
              <p style="margin: 0 0 20px;">আসসালামু আলাইকুম ${buyerName},</p>
              <p style="margin: 0 0 20px;">${
                type === "confirmation"
                  ? "আপনার অর্ডার সফলভাবে গ্রহণ করা হয়েছে। আমরা আপনার অর্ডার প্রক্রিয়া করছি।"
                  : type === "shipping"
                  ? "সুসংবাদ! আপনার অর্ডার পাঠানো হয়েছে এবং আপনার কাছে আসার পথে।"
                  : "আপনার অর্ডার সম্পর্কে একটি আপডেট রয়েছে।"
              }</p>

              <!-- Order Details Box -->
              <div style="background-color: #f8fafc; border-radius: 6px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;">
                <h2 style="color: #004d40; margin: 0 0 15px; font-size: 18px; font-weight: 600;">অর্ডার বিবরণ</h2>
                <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="padding: 8px 0; color: #4b5563; font-size: 14px;">অর্ডার আইডি:</td>
                    <td style="padding: 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">#${orderId}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #4b5563; font-size: 14px;">অর্ডারের তারিখ:</td>
                    <td style="padding: 8px 0; color: #1f2937; font-size: 14px;">${formatDate(
                      orderDate
                    )}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #4b5563; font-size: 14px;">মোট পরিমাণ:</td>
                    <td style="padding: 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">${formatCurrency(
                      totalAmount
                    )}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #4b5563; font-size: 14px;">পেমেন্ট স্ট্যাটাস:</td>
                    <td style="padding: 8px 0; color: ${getStatusColor(
                      paymentStatus
                    )}; font-weight: 600; font-size: 14px;">${paymentStatus}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #4b5563; font-size: 14px;">ডেলিভারি ঠিকানা:</td>
                    <td style="padding: 8px 0; color: #1f2937; font-size: 14px;">${deliveryAddress}</td>
                  </tr>
                </table>
              </div>

              <!-- Items List -->
              <h3 style="color: #004d40; margin: 20px 0 15px; font-size: 16px; font-weight: 600;">অর্ডার আইটেম</h3>
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
                ${items
                  .map(
                    (item) => `
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                        <tr>
                          <td class="mobile-stack" style="width: 60px; padding-right: 15px;">
                            <img src="${item.coverImage}" alt="${
                      item.title
                    }" width="60" height="90" class="item-image" style="border-radius: 4px; display: block;">
                          </td>
                          <td class="mobile-stack" style="vertical-align: top;">
                            <p style="margin: 0 0 6px; color: #1f2937; font-weight: 600; font-size: 14px;">${
                              item.title
                            }</p>
                            <p style="margin: 0 0 4px; color: #4b5563; font-size: 13px;">পরিমাণ: ${
                              item.qty
                            }</p>
                            <p style="margin: 0; color: #4b5563; font-size: 13px;">মূল্য: ${formatCurrency(
                              item.price
                            )}</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                `
                  )
                  .join("")}
              </table>

              <!-- Call to Action -->
              <div style="text-align: center; margin: 25px 0;">
                <a href="${
                  process.env.URL
                }/orders/${orderId}" style="background-color: #00796b; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; display: inline-block; transition: background-color 0.2s;">
                  অর্ডার বিবরণ দেখুন
                </a>
              </div>

              <p style="color: #4b5563; font-size: 13px; line-height: 1.6; margin: 20px 0 0;">
                আপনার অর্ডার সম্পর্কে কোন প্রশ্ন থাকলে, আমাদের সাথে যোগাযোগ করতে দ্বিধা করবেন না: <a href="mailto:support@at-taleem.vercel.app" style="color: #004d40; text-decoration: none;">support@at-taleem.vercel.app</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #eef2f7; padding: 20px; text-align: center; font-size: 12px; color: #666666;">
              <p style="margin: 0 0 10px;">© ${new Date().getFullYear()} At-Taleem</p>
              <p style="margin: 0;">
                <a href=${
                  process.env.URL
                } style="color: #004d40; text-decoration: none;">আমাদের ওয়েবসাইট দেখুন</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  };
};
