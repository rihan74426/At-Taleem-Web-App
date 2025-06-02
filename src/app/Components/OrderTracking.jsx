"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import Loader from "./Loader";

const STATUS_COLORS = {
  pending: "bg-yellow-500",
  processing: "bg-blue-500",
  shipped: "bg-purple-500",
  delivered: "bg-green-500",
  cancelled: "bg-red-500",
  failed: "bg-red-500",
};

const STATUS_ICONS = {
  pending: "⏳",
  processing: "⚙️",
  shipped: "📦",
  delivered: "✅",
  cancelled: "❌",
  failed: "❌",
};

export default function OrderTracking({ orderId }) {
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/orders/${orderId}`);
      if (!res.ok) throw new Error("Failed to fetch order details");
      const data = await res.json();
      setOrder(data);
      setError(null);
    } catch (err) {
      setError(err.message);
      toast.error("Failed to load order details");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!order) return null;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Order Header */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold mb-2">Order #{order._id}</h2>
            <p className="text-gray-600">
              Placed on {format(new Date(order.createdAt), "PPP")}
            </p>
          </div>
          <div className="text-right">
            <span
              className={`inline-block px-3 py-1 rounded-full text-white ${
                STATUS_COLORS[order.status]
              }`}
            >
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </span>
          </div>
        </div>
      </div>

      {/* Tracking Timeline */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Order Timeline</h3>
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

          {/* Timeline Items */}
          <div className="space-y-8">
            {order.tracking.map((update, index) => (
              <motion.div
                key={update._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative pl-12"
              >
                {/* Timeline Dot */}
                <div
                  className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center text-white ${
                    STATUS_COLORS[update.status]
                  }`}
                >
                  {STATUS_ICONS[update.status]}
                </div>

                {/* Content */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold capitalize">
                        {update.status}
                      </h4>
                      <p className="text-gray-600">{update.message}</p>
                    </div>
                    <span className="text-sm text-gray-500">
                      {format(new Date(update.timestamp), "PPp")}
                    </span>
                  </div>
                  {update.location && (
                    <p className="text-sm text-gray-500 mt-2">
                      Location: {update.location}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Order Details */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Order Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Customer Information */}
          <div>
            <h4 className="font-semibold mb-2">Customer Information</h4>
            <div className="space-y-2">
              <p>
                <span className="text-gray-600">Name:</span>{" "}
                {order.customer.name}
              </p>
              <p>
                <span className="text-gray-600">Email:</span>{" "}
                {order.customer.email}
              </p>
              <p>
                <span className="text-gray-600">Phone:</span>{" "}
                {order.customer.phone}
              </p>
              <p>
                <span className="text-gray-600">Address:</span>{" "}
                {order.deliveryAddress}
              </p>
            </div>
          </div>

          {/* Payment Information */}
          <div>
            <h4 className="font-semibold mb-2">Payment Information</h4>
            <div className="space-y-2">
              <p>
                <span className="text-gray-600">Payment Status:</span>{" "}
                <span
                  className={`inline-block px-2 py-0.5 rounded-full text-white text-sm ${
                    order.paymentStatus === "paid"
                      ? "bg-green-500"
                      : "bg-yellow-500"
                  }`}
                >
                  {order.paymentStatus}
                </span>
              </p>
              <p>
                <span className="text-gray-600">Amount:</span> {order.amount}{" "}
                BDT
              </p>
              {order.transactionId && (
                <p>
                  <span className="text-gray-600">Transaction ID:</span>{" "}
                  {order.transactionId}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="mt-6">
          <h4 className="font-semibold mb-2">Order Items</h4>
          <div className="space-y-4">
            {order.items.map((item) => (
              <div
                key={item._id}
                className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg"
              >
                <img
                  src={item.book.coverImage}
                  alt={item.book.title}
                  className="w-16 h-16 object-cover rounded"
                />
                <div className="flex-1">
                  <h5 className="font-medium">{item.book.title}</h5>
                  <p className="text-sm text-gray-600">
                    Quantity: {item.quantity}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{item.price} BDT</p>
                  <p className="text-sm text-gray-600">
                    Total: {item.price * item.quantity} BDT
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
