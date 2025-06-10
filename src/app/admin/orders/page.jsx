"use client";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { toast } from "react-hot-toast";
import Image from "next/image";
import Link from "next/link";
import {
  FiChevronDown,
  FiFilter,
  FiSearch,
  FiDownload,
  FiPackage,
  FiTruck,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiClock,
  FiMail,
  FiTrash2,
  FiDollarSign,
  FiRefreshCw,
} from "react-icons/fi";
import SendEmailModal from "@/app/Components/sendEmail";
import ResponseModal from "@/app/Components/ResponseModal";
import OrderSkeleton from "@/app/Components/OrderSkeleton";

// Status colors and icons
const STATUS_COLORS = {
  pending:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  processing: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  delivery:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  completed:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  cancelled: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
  delivered:
    "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
};

const STATUS_ICONS = {
  pending: <FiClock className="w-4 h-4" />,
  processing: <FiRefreshCw className="w-4 h-4" />,
  delivery: <FiTruck className="w-4 h-4" />,
  delivered: <FiPackage className="w-4 h-4" />,
  completed: <FiCheckCircle className="w-4 h-4" />,
  failed: <FiXCircle className="w-4 h-4" />,
  cancelled: <FiAlertCircle className="w-4 h-4" />,
};

const PAYMENT_STATUS_COLORS = {
  Paid: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  Unpaid: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  Refunded:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  Failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
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
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedOrderForEmail, setSelectedOrderForEmail] = useState(null);
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
  const [modal, setModal] = useState({
    isOpen: false,
    message: "",
    status: "",
  });
  const showModal = (m, s) => setModal({ isOpen: true, message: m, status: s });

  const handleSendEmail = (order) => {
    setSelectedOrderForEmail(order);
    setShowEmailModal(true);
  };

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

  const handleOrderAction = async (orderId, status) => {
    try {
      const res = await fetch("/api/orders/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status }),
      });

      if (!res.ok) throw new Error("Failed to update order status");

      const data = await res.json();
      toast.success(data.message || "Order status updated successfully");
      showModal(
        "Order status updated to " + status + " successfully",
        "success"
      );
      fetchOrders();
    } catch (error) {
      toast.error(error.message);
      showModal("Failed to update order status", "error");
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (
      !confirm(
        "Are you sure you want to delete this order? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete order");

      const data = await res.json();
      toast.success(data.message || "Order deleted successfully");
      showModal("Order deleted successfully", "success");
      fetchOrders();
    } catch (error) {
      toast.error(error.message);
      showModal("Failed to delete order", "error");
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedOrders.length === 0) {
      toast.error("Please select orders first");
      return;
    }

    try {
      const res = await fetch("/api/orders/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderIds: selectedOrders,
          action,
        }),
      });

      if (!res.ok) throw new Error("Failed to perform bulk action");

      const data = await res.json();
      toast.success(data.message || "Bulk action completed successfully");
      showModal("Bulk action completed successfully", "success");
      fetchOrders();
      setSelectedOrders([]);
    } catch (error) {
      toast.error(error.message);
      showModal("Failed to perform bulk action", "error");
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
      showModal("Orders exported successfully", "success");
    } catch (error) {
      toast.error(error.message);
      showModal("Failed to export orders", "error");
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
        order._id.toLowerCase().includes(searchLower) ||
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
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Order Management
            </h1>
            <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-1"></div>
          </div>
          <div className="flex gap-3">
            <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
            <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
                  <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </div>
                <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Search and Sort */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
          <div className="h-10 w-48 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
        </div>

        {/* Orders List */}
        <div className="space-y-6">
          <OrderSkeleton count={3} />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Order Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage and track all orders
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <FiFilter className="w-5 h-5" />
            <span>Filters</span>
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <FiDownload className="w-5 h-5" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Orders
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.total}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <FiPackage className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Revenue
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.totalRevenue} BDT
              </p>
            </div>
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900 rounded-lg">
              <FiDollarSign className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Pending Orders
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.pending}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <FiClock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Processing Orders
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.processing}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <FiRefreshCw className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, status: e.target.value }))
                }
                className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="delivery">Delivery</option>
                <option value="delivered">Delivered</option>
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
                className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search and Sort */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search orders by ID, name, email, or book title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="amount-high">Amount: High to Low</option>
          <option value="amount-low">Amount: Low to High</option>
        </select>
      </div>

      {/* Bulk Actions */}
      {selectedOrders.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-xl mb-6 border border-blue-200 dark:border-blue-800">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <p className="text-blue-800 dark:text-blue-200 font-medium">
              {selectedOrders.length} orders selected
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleBulkAction("mark-processing")}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Mark as Processing
              </button>
              <button
                onClick={() => handleBulkAction("mark-delivery")}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Mark as Delivery
              </button>
              <button
                onClick={() => handleBulkAction("mark-completed")}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Mark as Completed
              </button>
              <button
                onClick={() => handleBulkAction("mark-paid")}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Mark as Paid
              </button>
              <button
                onClick={() => handleBulkAction("mark-cancelled")}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Cancel Orders
              </button>
              <button
                onClick={() => handleBulkAction("delete")}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete Orders
              </button>
              <button
                onClick={() => setSelectedOrders([])}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            No orders found
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map((order) => (
            <motion.div
              key={order._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
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
                      className="h-5 w-5 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Order #{order._id}
                      </h2>
                      <p className="text-gray-500 dark:text-gray-400">
                        {format(new Date(order.createdAt), "PPP")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1.5 ${
                        STATUS_COLORS[order.status]
                      }`}
                    >
                      {STATUS_ICONS[order.status]}
                      {order.status}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        PAYMENT_STATUS_COLORS[order.paymentStatus]
                      }`}
                    >
                      {order.paymentStatus}
                    </span>
                    <Link
                      href={`/admin/orders/${order._id}`}
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      View Details
                    </Link>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                      Customer Information
                    </h3>
                    <div className="space-y-2">
                      <p className="text-gray-600 dark:text-gray-300">
                        <span className="text-gray-500 dark:text-gray-400">
                          Name:
                        </span>{" "}
                        {order.buyerName}
                      </p>
                      <p className="text-gray-600 dark:text-gray-300">
                        <span className="text-gray-500 dark:text-gray-400">
                          Email:
                        </span>{" "}
                        {order.buyerEmail}
                      </p>
                      <p className="text-gray-600 dark:text-gray-300">
                        <span className="text-gray-500 dark:text-gray-400">
                          Phone:
                        </span>{" "}
                        {order.deliveryPhone}
                      </p>
                      <p className="text-gray-600 dark:text-gray-300">
                        <span className="text-gray-500 dark:text-gray-400">
                          Address:
                        </span>{" "}
                        {order.deliveryAddress}
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                      Order Summary
                    </h3>
                    <div className="space-y-2">
                      <p className="text-gray-600 dark:text-gray-300">
                        <span className="text-gray-500 dark:text-gray-400">
                          Total Amount:
                        </span>{" "}
                        <span className="font-semibold">
                          {order.amount} BDT
                        </span>
                      </p>
                      <p className="text-gray-600 dark:text-gray-300">
                        <span className="text-gray-500 dark:text-gray-400">
                          Items:
                        </span>{" "}
                        {order.items.length}
                      </p>
                    </div>
                  </div>
                </div>

                {order.tracking && order.tracking.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                      Order Timeline
                    </h3>
                    <div className="space-y-2">
                      {order.tracking.map((update, index) => (
                        <div
                          key={index}
                          className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                                STATUS_COLORS[update.status]
                              }`}
                            >
                              {STATUS_ICONS[update.status]}
                              {update.status}
                            </span>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              {update.message}
                            </p>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {format(new Date(update.timestamp), "PPp")}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleOrderAction(order._id, "processing")}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <FiRefreshCw className="w-4 h-4" />
                    Processing
                  </button>
                  <button
                    onClick={() => handleOrderAction(order._id, "delivery")}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                  >
                    <FiTruck className="w-4 h-4" />
                    Delivery
                  </button>
                  <button
                    onClick={() => handleOrderAction(order._id, "delivered")}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                  >
                    <FiPackage className="w-4 h-4" />
                    Delivered
                  </button>
                  <button
                    onClick={() => handleOrderAction(order._id, "completed")}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <FiCheckCircle className="w-4 h-4" />
                    Completed
                  </button>
                  <button
                    onClick={() => handleOrderAction(order._id, "cancelled")}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex items-center gap-2"
                  >
                    <FiAlertCircle className="w-4 h-4" />
                    Cancel
                  </button>
                  <button
                    onClick={() => handleOrderAction(order._id, "paid")}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
                  >
                    <FiDollarSign className="w-4 h-4" />
                    Mark Paid
                  </button>
                  <button
                    onClick={() => handleDeleteOrder(order._id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                  >
                    <FiTrash2 className="w-4 h-4" />
                    Delete
                  </button>
                  <button
                    onClick={() => handleSendEmail(order)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                  >
                    <FiMail className="w-4 h-4" />
                    Email
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showEmailModal && selectedOrderForEmail && (
          <SendEmailModal
            recipientEmail={selectedOrderForEmail.buyerEmail}
            defaultHeader={`Order Update - #${selectedOrderForEmail._id}`}
            defaultBody={`<p>Dear ${selectedOrderForEmail.buyerName},</p>
              <p>We hope this email finds you well.</p>
              <p>
                This is regarding your order #${selectedOrderForEmail._id}.<br/>
                We are pleased to inform you that your order has been successfully processed.
              </p>
              <p>Your order details are as follows:</p>
              <p>
                <strong>Order ID:</strong> #${selectedOrderForEmail._id}<br/>
                <strong>Order Date:</strong> ${format(
                  new Date(selectedOrderForEmail.createdAt),
                  "PPP"
                )}<br/>
                <strong>Total Amount:</strong> ${
                  selectedOrderForEmail.amount
                } BDT<br/>
                <strong>Payment Status:</strong> ${
                  selectedOrderForEmail.paymentStatus
                }<br/>
                <strong>Delivery Address:</strong> ${
                  selectedOrderForEmail.deliveryAddress
                }
              </p>
              <p>We will notify you once your order is shipped.</p>
              <p>Thank you for choosing At-Taleem. We look forward to serving you again.</p>`}
            defaultFooter="© 2024 At-Taleem. All rights reserved."
            onClose={() => {
              setShowEmailModal(false);
              setSelectedOrderForEmail(null);
            }}
          />
        )}
      </AnimatePresence>

      <ResponseModal
        isOpen={modal.isOpen}
        message={modal.message}
        status={modal.status}
        onClose={() => setModal((m) => ({ ...m, isOpen: false }))}
      />
    </div>
  );
}
