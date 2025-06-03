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
        return "#059669";
      case "Unpaid":
        return "#DC2626";
      case "Refunded":
        return "#7C3AED";
      case "Failed":
        return "#DC2626";
      default:
        return "#1F2937";
    }
  };

  return {
    subject: getSubject(),
    html: `
<!DOCTYPE html>
<html lang="en">
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
<body style="margin: 0; padding: 0; background-color: #f4f4f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; font-size: 14px; line-height: 1.4; color: #333333;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table role="presentation" class="email-container" width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: #1e40af; padding: 30px; text-align: center;">
              <img src="cid:logo" alt="At-Taleem Logo" width="60" height="60" style="max-width: 60px; margin-bottom: 15px; border-radius: 50%;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #ffffff; letter-spacing: -0.5px;">${getHeader()}</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td class="email-content" style="padding: 30px;">
              <p style="margin: 0 0 15px; font-size: 14px; line-height: 1.6; color: #1F2937;">
                Dear ${buyerName},
              </p>
              <p style="margin: 0 0 15px; font-size: 14px; line-height: 1.6; color: #1F2937;">
                ${
                  type === "confirmation"
                    ? "Thank you for your order! We are pleased to confirm that we have received your order and it is being processed."
                    : type === "shipping"
                    ? "Great news! Your order has been shipped and is on its way to you."
                    : "We have an update regarding your order."
                }
              </p>

              <!-- Order Details Box -->
              <div style="background-color: #f8fafc; border-radius: 6px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;">
                <h2 style="color: #1e40af; margin: 0 0 15px; font-size: 18px; font-weight: 600;">Order Details</h2>
                <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="padding: 8px 0; color: #4b5563; font-size: 14px;">Order ID:</td>
                    <td style="padding: 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">#${orderId}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #4b5563; font-size: 14px;">Order Date:</td>
                    <td style="padding: 8px 0; color: #1f2937; font-size: 14px;">${orderDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #4b5563; font-size: 14px;">Total Amount:</td>
                    <td style="padding: 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">${totalAmount} BDT</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #4b5563; font-size: 14px;">Payment Status:</td>
                    <td style="padding: 8px 0; color: ${getStatusColor(
                      paymentStatus
                    )}; font-weight: 600; font-size: 14px;">${paymentStatus}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #4b5563; font-size: 14px;">Delivery Address:</td>
                    <td style="padding: 8px 0; color: #1f2937; font-size: 14px;">${deliveryAddress}</td>
                  </tr>
                </table>
              </div>

              <!-- Items List -->
              <h3 style="color: #1e40af; margin: 20px 0 15px; font-size: 16px; font-weight: 600;">Order Items</h3>
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
                ${items
                  .map(
                    (item) => `
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                        <tr>
                          <td class="mobile-stack" style="width: 60px; padding-right: 15px;">
                            <img src="${item.bookId?.coverImage}" alt="${item.bookId?.title}" width="60" height="90" class="item-image" style="border-radius: 4px; display: block;">
                          </td>
                          <td class="mobile-stack" style="vertical-align: top;">
                            <p style="margin: 0 0 6px; color: #1f2937; font-weight: 600; font-size: 14px;">${item.bookId?.title}</p>
                            <p style="margin: 0 0 4px; color: #4b5563; font-size: 13px;">Quantity: ${item.qty}</p>
                            <p style="margin: 0; color: #4b5563; font-size: 13px;">Price: ${item.price} BDT</p>
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
                <a href={"${
                  process.env.URL
                }/orders/${orderId}"} style="background-color: #1e40af; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; display: inline-block; transition: background-color 0.2s;">
                  View Order Details
                </a>
              </div>

              <p style="color: #4b5563; font-size: 13px; line-height: 1.6; margin: 20px 0 0;">
                If you have any questions about your order, please don't hesitate to contact us at <a href="mailto:support@at-taleem.vercel.app" style="color: #1e40af; text-decoration: none;">support@at-taleem.vercel.app</a>.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px; color: #6b7280; font-size: 13px;">© ${new Date().getFullYear()} At-Taleem. All rights reserved.</p>
              <p style="margin: 0 0 8px;">
                <a href="https://at-taleem.vercel.app" style="color: #1e40af; text-decoration: none; font-size: 13px;">Visit our website</a>
              </p>
              <p style="margin: 0; color: #6b7280; font-size: 12px;">
                You're receiving this email because you placed an order with At-Taleem.
                <br>
                <a href="https://at-taleem.vercel.app/unsubscribe" style="color: #1e40af; text-decoration: none;">Unsubscribe</a>
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
