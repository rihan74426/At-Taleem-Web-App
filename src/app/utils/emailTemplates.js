export const buildOrderEmailTemplate = ({
  orderId,
  buyerName,
  orderDate,
  totalAmount,
  paymentStatus,
  paymentMethod,
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

  return {
    subject: getSubject(),
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f7; font-family: Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center" style="padding: 20px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: #1e40af; padding: 30px; text-align: center;">
              <img src="https://at-taleem.vercel.app/favicon.png" alt="At-Taleem Logo" width="60" height="60" style="border-radius: 50%; margin-bottom: 15px;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">${getHeader()}</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 30px;">
              <p style="color: #333333; font-size: 16px; line-height: 1.5; margin: 0 0 20px;">
                Dear ${buyerName},
              </p>
              <p style="color: #333333; font-size: 16px; line-height: 1.5; margin: 0 0 20px;">
                ${
                  type === "confirmation"
                    ? "Thank you for your order! We are pleased to confirm that we have received your order and it is being processed."
                    : type === "shipping"
                    ? "Great news! Your order has been shipped and is on its way to you."
                    : "We have an update regarding your order."
                }
              </p>

              <!-- Order Details Box -->
              <div style="background-color: #f8fafc; border-radius: 6px; padding: 20px; margin: 20px 0;">
                <h2 style="color: #1e40af; margin: 0 0 15px; font-size: 18px;">Order Details</h2>
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="padding: 8px 0; color: #4b5563;">Order ID:</td>
                    <td style="padding: 8px 0; color: #1f2937; font-weight: bold;">#${orderId}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #4b5563;">Order Date:</td>
                    <td style="padding: 8px 0; color: #1f2937;">${orderDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #4b5563;">Total Amount:</td>
                    <td style="padding: 8px 0; color: #1f2937; font-weight: bold;">${totalAmount} BDT</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #4b5563;">Payment Status:</td>
                    <td style="padding: 8px 0; color: #1f2937;">${paymentStatus}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #4b5563;">Payment Method:</td>
                    <td style="padding: 8px 0; color: #1f2937;">${paymentMethod}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #4b5563;">Delivery Address:</td>
                    <td style="padding: 8px 0; color: #1f2937;">${deliveryAddress}</td>
                  </tr>
                </table>
              </div>

              <!-- Items List -->
              <h3 style="color: #1e40af; margin: 20px 0 15px; font-size: 16px;">Order Items</h3>
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
                ${items
                  .map(
                    (item) => `
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                      <div style="display: flex; align-items: center;">
                        <img src="${item.coverImage}" alt="${item.title}" width="50" height="75" style="border-radius: 4px; margin-right: 15px;">
                        <div>
                          <p style="margin: 0; color: #1f2937; font-weight: bold;">${item.title}</p>
                          <p style="margin: 5px 0 0; color: #4b5563;">Quantity: ${item.qty}</p>
                          <p style="margin: 5px 0 0; color: #4b5563;">Price: ${item.price} BDT</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                `
                  )
                  .join("")}
              </table>

              <!-- Call to Action -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://at-taleem.vercel.app/orders" style="background-color: #1e40af; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                  View Order Details
                </a>
              </div>

              <p style="color: #4b5563; font-size: 14px; line-height: 1.5; margin: 20px 0 0;">
                If you have any questions about your order, please don't hesitate to contact us.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px; text-align: center; color: #6b7280; font-size: 14px;">
              <p style="margin: 0 0 10px;">© 2024 At-Taleem. All rights reserved.</p>
              <p style="margin: 0;">
                <a href="https://at-taleem.vercel.app" style="color: #1e40af; text-decoration: none;">Visit our website</a>
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
