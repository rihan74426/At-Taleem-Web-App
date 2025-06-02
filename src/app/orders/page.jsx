"use client";

// Import necessary hooks and components
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import {
  OrderDetailsModal,
  EditOrderModal,
} from "@/app/Components/orderModals";
import { FiChevronDown, FiMail } from "react-icons/fi";
import Loader from "@/app/Components/Loader";
import { useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import SendEmailModal from "@/app/Components/sendEmail";

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
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedOrderForEmail, setSelectedOrderForEmail] = useState(null);

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
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders
    .filter((order) => {
      if (filter === "all") return true;
      return order.status === filter;
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

  const handleSendEmail = (order) => {
    setSelectedOrderForEmail(order);
    setShowEmailModal(true);
  };

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
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border dark:bg-black rounded-lg px-4 py-2"
          >
            <option value="all">All Orders</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="delivery">Delivery</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border dark:bg-black rounded-lg px-4 py-2"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="amount-high">Amount: High to Low</option>
            <option value="amount-low">Amount: Low to High</option>
          </select>
        </div>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search orders by ID, name, email, or book title..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full border dark:bg-black rounded-lg px-4 py-2"
        />
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
                    {user?.publicMetadata.isAdmin && (
                      <button
                        onClick={() => handleSendEmail(order)}
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        <FiMail /> Send Email
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      View Details
                    </button>
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
                        <span className="text-gray-500">Payment Method:</span>{" "}
                        {order.paymentMethod}
                      </p>
                      <p>
                        <span className="text-gray-500">Delivery Address:</span>{" "}
                        {order.deliveryAddress}
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
              </div>
            </motion.div>
          ))}
        </div>
      )}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}

      {showEmailModal && selectedOrderForEmail && (
        <SendEmailModal
          recipientEmail={selectedOrderForEmail.buyerEmail}
          defaultHeader={`Order Update - #${selectedOrderForEmail._id}`}
          defaultBody={`Dear ${
            selectedOrderForEmail.buyerName
          },\n\nWe hope this email finds you well. This is regarding your order #${
            selectedOrderForEmail._id
          }. We are pleased to inform you that your order has been successfully processed. Your order details are as follows:\n\nOrder ID: #${
            selectedOrderForEmail._id
          }\n. Order Date: ${format(
            new Date(selectedOrderForEmail.createdAt),
            "PPP"
          )}\n. Total Amount: ${
            selectedOrderForEmail.amount
          } BDT\n\n. Payment Status: ${
            selectedOrderForEmail.paymentStatus
          }\n\n. Payment Method: ${
            selectedOrderForEmail.paymentMethod
          }\n\n. Delivery Address: ${
            selectedOrderForEmail.deliveryAddress
          }\n\n. We will notify you once your order is shipped. Thank you for choosing At-Taleem. We look forward to serving you again.`}
          defaultFooter="© 2025 At-Taleem. All rights reserved."
          onClose={() => {
            setShowEmailModal(false);
            setSelectedOrderForEmail(null);
          }}
        />
      )}
    </div>
  );
}
