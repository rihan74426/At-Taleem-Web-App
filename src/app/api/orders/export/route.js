import { connect } from "@/lib/mongodb/mongoose";
import Order from "@/lib/models/Order";
import { auth } from "@clerk/nextjs";
import { rateLimit } from "@/lib/rate-limit";
import { format } from "date-fns";

// Rate limiter: 5 requests per minute
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});

export async function POST(req) {
  try {
    // Rate limiting
    await limiter.check(5);

    // Authentication check
    const { userId } = auth();
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    // Connect to database
    await connect();

    const body = await req.json();
    const { filters, searchQuery, sortBy } = body;

    // Build query
    const query = {};
    if (filters.status !== "all") query.status = filters.status;
    if (filters.paymentStatus !== "all")
      query.paymentStatus = filters.paymentStatus;
    if (filters.dateRange !== "all") {
      const now = new Date();
      let startDate;
      switch (filters.dateRange) {
        case "today":
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case "week":
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case "month":
          startDate = new Date(now.setDate(now.getDate() - 30));
          break;
        default:
          startDate = new Date(0);
      }
      query.createdAt = { $gte: startDate };
    }

    if (searchQuery) {
      query.$or = [
        { orderId: { $regex: searchQuery, $options: "i" } },
        { buyerName: { $regex: searchQuery, $options: "i" } },
        { buyerEmail: { $regex: searchQuery, $options: "i" } },
        { deliveryPhone: { $regex: searchQuery, $options: "i" } },
      ];
    }

    // Get sort options
    let sort = {};
    switch (sortBy) {
      case "newest":
        sort = { createdAt: -1 };
        break;
      case "oldest":
        sort = { createdAt: 1 };
        break;
      case "amount-high":
        sort = { amount: -1 };
        break;
      case "amount-low":
        sort = { amount: 1 };
        break;
      default:
        sort = { createdAt: -1 };
    }

    // Fetch orders
    const orders = await Order.find(query)
      .sort(sort)
      .populate("items.bookId")
      .lean();

    // Convert to CSV
    const headers = [
      "Order ID",
      "Date",
      "Customer Name",
      "Email",
      "Phone",
      "Address",
      "Items",
      "Total Amount",
      "Payment Status",
      "Order Status",
      "Payment Method",
      "Tracking Updates",
    ];

    const rows = orders.map((order) => {
      const items = order.items
        .map((item) => `${item.bookId.title} (${item.qty} x ${item.price} BDT)`)
        .join("; ");

      const tracking = order.tracking
        .map(
          (update) =>
            `${format(new Date(update.timestamp), "PPp")}: ${update.message}`
        )
        .join(" | ");

      return [
        order.orderId,
        format(new Date(order.createdAt), "PPp"),
        order.buyerName,
        order.buyerEmail,
        order.deliveryPhone,
        order.deliveryAddress,
        items,
        order.amount,
        order.paymentStatus,
        order.status,
        order.paymentMethod,
        tracking,
      ];
    });

    // Create CSV content
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    // Return CSV file
    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="orders-export-${format(
          new Date(),
          "yyyy-MM-dd"
        )}.csv"`,
      },
    });
  } catch (error) {
    console.error("Error exporting orders:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  }
}
