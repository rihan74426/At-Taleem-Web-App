"use client";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { toast } from "react-hot-toast";
import Image from "next/image";
import Link from "next/link";
import { FiChevronDown, FiFilter, FiSearch, FiDownload } from "react-icons/fi";

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

export default function AdminOrdersPage() {
  const { user, isSignedIn } = useUser();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: "all",
    paymentStatus: "all",
    dateRange: "all",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    delivery: 0,
    completed: 0,
    failed: 0,
    cancelled: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    if (isSignedIn) {
      fetchOrders();
    }
  }, [isSignedIn]);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders/admin");
      if (!res.ok) throw new Error("Failed to fetch orders");
      const data = await res.json();
      setOrders(data.orders);
      setStats(data.stats);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedOrders.length === 0) {
      toast.error("Please select orders first");
      return;
    }

    try {
      const res = await fetch("/api/orders/bulk-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderIds: selectedOrders,
          action,
        }),
      });

      if (!res.ok) throw new Error("Failed to perform bulk action");

      toast.success("Bulk action completed successfully");
      fetchOrders();
      setSelectedOrders([]);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleExport = async () => {
    try {
      const res = await fetch("/api/orders/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filters,
          searchQuery,
          sortBy,
        }),
      });

      if (!res.ok) throw new Error("Failed to export orders");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `orders-export-${format(new Date(), "yyyy-MM-dd")}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const filteredOrders = orders
    .filter((order) => {
      if (filters.status !== "all" && order.status !== filters.status)
        return false;
      if (
        filters.paymentStatus !== "all" &&
        order.paymentStatus !== filters.paymentStatus
      )
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
        order.orderId.toLowerCase().includes(searchLower) ||
        order.buyerName.toLowerCase().includes(searchLower) ||
        order.buyerEmail.toLowerCase().includes(searchLower) ||
        order.deliveryPhone.includes(searchQuery) ||
        order.items.some((item) =>
          item.book.title.toLowerCase().includes(searchLower)
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
            Please sign in to access admin panel
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
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Order Management</h1>
        <div className="flex gap-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            <FiFilter />
            Filters
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            <FiDownload />
            Export
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">Total Orders</h3>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">Total Revenue</h3>
          <p className="text-2xl font-bold">{stats.totalRevenue} BDT</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">Pending Orders</h3>
          <p className="text-2xl font-bold">{stats.pending}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">Processing Orders</h3>
          <p className="text-2xl font-bold">{stats.processing}</p>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, status: e.target.value }))
              }
              className="border rounded-lg px-4 py-2"
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
              value={filters.paymentStatus}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  paymentStatus: e.target.value,
                }))
              }
              className="border rounded-lg px-4 py-2"
            >
              <option value="all">All Payment Statuses</option>
              <option value="Unpaid">Unpaid</option>
              <option value="Paid">Paid</option>
              <option value="Failed">Failed</option>
              <option value="Refunded">Refunded</option>
            </select>

            <select
              value={filters.dateRange}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, dateRange: e.target.value }))
              }
              className="border rounded-lg px-4 py-2"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
          </div>
        </motion.div>
      )}

      {/* Search and Sort */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="border rounded-lg px-4 py-2"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="amount-high">Amount: High to Low</option>
          <option value="amount-low">Amount: Low to High</option>
        </select>
      </div>

      {/* Bulk Actions */}
      {selectedOrders.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg mb-6">
          <div className="flex items-center justify-between">
            <p className="text-blue-800 dark:text-blue-200">
              {selectedOrders.length} orders selected
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkAction("mark-processing")}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Mark as Processing
              </button>
              <button
                onClick={() => handleBulkAction("mark-delivery")}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                Mark as Delivery
              </button>
              <button
                onClick={() => handleBulkAction("mark-completed")}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Mark as Completed
              </button>
              <button
                onClick={() => setSelectedOrders([])}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Orders List */}
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
                  <div className="flex items-center gap-4">
                    <input
                      type="checkbox"
                      checked={selectedOrders.includes(order._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedOrders((prev) => [...prev, order._id]);
                        } else {
                          setSelectedOrders((prev) =>
                            prev.filter((id) => id !== order._id)
                          );
                        }
                      }}
                      className="h-5 w-5 rounded border-gray-300"
                    />
                    <div>
                      <h2 className="text-xl font-semibold mb-2">
                        Order #{order.orderId}
                      </h2>
                      <p className="text-gray-500">
                        {format(new Date(order.createdAt), "PPP")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${
                        STATUS_COLORS[order.status]
                      }`}
                    >
                      {STATUS_ICONS[order.status]} {order.status}
                    </span>
                    <Link
                      href={`/admin/orders/${order.orderId}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      View Details
                    </Link>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-2">Customer Information</h3>
                    <div className="space-y-2">
                      <p>
                        <span className="text-gray-500">Name:</span>{" "}
                        {order.buyerName}
                      </p>
                      <p>
                        <span className="text-gray-500">Email:</span>{" "}
                        {order.buyerEmail}
                      </p>
                      <p>
                        <span className="text-gray-500">Phone:</span>{" "}
                        {order.deliveryPhone}
                      </p>
                      <p>
                        <span className="text-gray-500">Address:</span>{" "}
                        {order.deliveryAddress}
                      </p>
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
                        <span className="text-gray-500">Payment Method:</span>{" "}
                        {order.paymentMethod}
                      </p>
                      <p>
                        <span className="text-gray-500">Items:</span>{" "}
                        {order.items.length}
                      </p>
                    </div>
                  </div>
                </div>

                {order.tracking && order.tracking.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-semibold mb-2">Latest Update</h3>
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <p className="text-sm">
                        {order.tracking[order.tracking.length - 1].message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {format(
                          new Date(
                            order.tracking[order.tracking.length - 1].timestamp
                          ),
                          "PPp"
                        )}
                      </p>
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="mt-6 flex gap-2">
                  <button
                    onClick={() => handleBulkAction("mark-processing")}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Mark as Processing
                  </button>
                  <button
                    onClick={() => handleBulkAction("mark-delivery")}
                    className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                  >
                    Mark as Delivery
                  </button>
                  <button
                    onClick={() => handleBulkAction("mark-completed")}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Mark as Completed
                  </button>
                  <button
                    onClick={() => handleBulkAction("send-email")}
                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                  >
                    Send Email
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
