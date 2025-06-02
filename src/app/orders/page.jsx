"use client";

// Import necessary hooks and components
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { FiChevronDown, FiFilter, FiSearch, FiDownload } from "react-icons/fi";
import { useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import ResponseModal from "@/app/Components/ResponseModal";

// Status colors and icons
const STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  delivery: "bg-purple-100 text-purple-800",
  completed: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-800",
};

const STATUS_ICONS = {
  pending: "⏳",
  processing: "🔄",
  delivery: "🚚",
  completed: "✅",
  failed: "❌",
  cancelled: "🚫",
};

export default function OrdersPage() {
  const { user, isSignedIn } = useUser();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: "all",
    dateRange: "all",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [modal, setModal] = useState({
    isOpen: false,
    message: "",
    status: "",
  });

  const showModal = (message, status) =>
    setModal({ isOpen: true, message, status });

  useEffect(() => {
    if (isSignedIn) {
      fetchOrders();
    }
  }, [isSignedIn]);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders");
      if (!res.ok) throw new Error("Failed to fetch orders");
      const data = await res.json();
      setOrders(data.orders);
    } catch (error) {
      toast.error(error.message);
      showModal("Failed to fetch orders", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!confirm("Are you sure you want to cancel this order?")) {
      return;
    }

    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });

      if (!res.ok) throw new Error("Failed to cancel order");

      const data = await res.json();
      toast.success(data.message || "Order cancelled successfully");
      showModal("Order cancelled successfully", "success");
      fetchOrders();
    } catch (error) {
      toast.error(error.message);
      showModal("Failed to cancel order", "error");
    }
  };

  const handleDownloadInvoice = async (orderId) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/invoice`);
      if (!res.ok) throw new Error("Failed to download invoice");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showModal("Invoice downloaded successfully", "success");
    } catch (error) {
      toast.error(error.message);
      showModal("Failed to download invoice", "error");
    }
  };

  const canCancelOrder = (order) => {
    return ["pending", "processing"].includes(order.status);
  };

  const filteredOrders = orders
    .filter((order) => {
      if (filters.status !== "all" && order.status !== filters.status)
        return false;
      if (filters.dateRange !== "all") {
        const orderDate = new Date(order.createdAt);
        const now = new Date();
        const daysAgo = (now - orderDate) / (1000 * 60 * 60 * 24);

        switch (filters.dateRange) {
          case "today":
            return daysAgo < 1;
          case "week":
            return daysAgo < 7;
          case "month":
            return daysAgo < 30;
          default:
            return true;
        }
      }
      return true;
    })
    .filter((order) => {
      if (!searchQuery) return true;
      const searchLower = searchQuery.toLowerCase();
      return (
        order._id.toLowerCase().includes(searchLower) ||
        order.buyerName.toLowerCase().includes(searchLower) ||
        order.buyerEmail.toLowerCase().includes(searchLower) ||
        order.items.some((item) =>
          item.bookId?.title.toLowerCase().includes(searchLower)
        )
      );
    })
    .sort((a, b) => {
      if (sortBy === "newest")
        return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === "oldest")
        return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === "amount-high") return b.amount - a.amount;
      if (sortBy === "amount-low") return a.amount - b.amount;
      return 0;
    });

  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">
            Please sign in to view your orders
          </h1>
          <Link
            href="/sign-in"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Orders</h1>
        <div className="flex gap-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <FiFilter />
            Filters
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow mb-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, status: e.target.value }))
              }
              className="border rounded-lg px-4 py-2 dark:bg-gray-800"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="delivery">Delivery</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <select
              value={filters.dateRange}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, dateRange: e.target.value }))
              }
              className="border rounded-lg px-4 py-2 dark:bg-gray-800"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
          </div>
        </motion.div>
      )}

      <div className="mb-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search orders by ID, name, email, or book title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-800"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border rounded-lg px-4 py-2 dark:bg-gray-800"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="amount-high">Amount: High to Low</option>
            <option value="amount-low">Amount: Low to High</option>
          </select>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No orders found</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map((order) => (
            <motion.div
              key={order._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-semibold mb-2">
                      Order #{order._id}
                    </h2>
                    <p className="text-gray-500">
                      {format(new Date(order.createdAt), "PPP")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${
                        STATUS_COLORS[order.status]
                      }`}
                    >
                      {STATUS_ICONS[order.status]} {order.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-2">Items</h3>
                    <div className="space-y-4">
                      {order.items.map((item) => (
                        <div key={item._id} className="flex items-center gap-4">
                          <Image
                            src={item.bookId?.coverImage}
                            alt={item.bookId?.title}
                            width={60}
                            height={90}
                            className="rounded-lg object-cover"
                          />
                          <div>
                            <p className="font-medium">{item.bookId?.title}</p>
                            <p className="text-gray-500">
                              {item.qty} x {item.price} BDT
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Order Summary</h3>
                    <div className="space-y-2">
                      <p>
                        <span className="text-gray-500">Total Amount:</span>{" "}
                        {order.amount} BDT
                      </p>
                      <p>
                        <span className="text-gray-500">Payment Status:</span>{" "}
                        <span
                          className={`${
                            order.paymentStatus === "Paid"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {order.paymentStatus}
                        </span>
                      </p>
                      <p>
                        <span className="text-gray-500">Delivery Address:</span>{" "}
                        {order.deliveryAddress}
                      </p>
                      <p>
                        <span className="text-gray-500">Phone:</span>{" "}
                        {order.deliveryPhone}
                      </p>
                    </div>
                  </div>
                </div>

                {order.tracking && order.tracking.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-semibold mb-2">Order Timeline</h3>
                    <div className="space-y-2">
                      {order.tracking.map((update, index) => (
                        <div
                          key={index}
                          className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                STATUS_COLORS[update.status]
                              }`}
                            >
                              {STATUS_ICONS[update.status]}
                            </span>
                            <p className="text-sm">{update.message}</p>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {format(new Date(update.timestamp), "PPp")}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="mt-6 flex gap-2">
                  {canCancelOrder(order) && (
                    <button
                      onClick={() => handleCancelOrder(order._id)}
                      className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                    >
                      Cancel Order
                    </button>
                  )}
                  {order.paymentStatus === "Paid" && (
                    <button
                      onClick={() => handleDownloadInvoice(order._id)}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Download Invoice
                    </button>
                  )}
                  <Link
                    href={`/orders/${order._id}`}
                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <ResponseModal
        isOpen={modal.isOpen}
        message={modal.message}
        status={modal.status}
        onClose={() => setModal((m) => ({ ...m, isOpen: false }))}
      />
    </div>
  );
}
