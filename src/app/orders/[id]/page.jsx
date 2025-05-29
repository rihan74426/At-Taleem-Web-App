// src/app/orders/[id]/page.jsx
"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import { toast } from "react-hot-toast";

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

export default function OrderDetailsPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders/${id}`);
        if (!res.ok) throw new Error("Failed to fetch order details");
        const data = await res.json();
        setOrder(data.order);
      } catch (error) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Order Not Found</h1>
          <Link href="/orders" className="text-blue-600 hover:text-blue-800">
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold">Order #{order.orderId}</h1>
            <p className="text-gray-500">
              Placed on {format(new Date(order.createdAt), "PPP")}
            </p>
          </div>
          <Link href="/orders" className="text-blue-600 hover:text-blue-800">
            ← Back to Orders
          </Link>
        </div>

        {/* Order Status */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold mb-2">Order Status</h2>
              <span
                className={`px-3 py-1 rounded-full text-sm ${
                  STATUS_COLORS[order.status]
                }`}
              >
                {STATUS_ICONS[order.status]} {order.status}
              </span>
            </div>
            <div className="text-right">
              <p className="text-gray-500">Payment Status</p>
              <span
                className={`px-3 py-1 rounded-full text-sm ${
                  order.paymentStatus === "Paid"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {order.paymentStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Customer Information */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Customer Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p>
                <span className="text-gray-500">Name:</span> {order.buyerName}
              </p>
              <p>
                <span className="text-gray-500">Email:</span> {order.buyerEmail}
              </p>
            </div>
            <div>
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
        </div>

        {/* Order Items */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Order Items</h2>
          <div className="space-y-4">
            {order.items.map((item) => (
              <div
                key={item._id}
                className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <Image
                  src={item.book?.coverImage}
                  alt={item.book?.title}
                  width={80}
                  height={120}
                  className="rounded-lg object-cover"
                />
                <div className="flex-1">
                  <h3 className="font-medium">{item.book?.title}</h3>
                  <p className="text-gray-500">
                    Quantity: {item.qty} × {item.price} BDT
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    {(item.qty * item.price).toFixed(2)} BDT
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">Total Amount</span>
              <span className="text-2xl font-bold">{order.amount} BDT</span>
            </div>
          </div>
        </div>

        {/* Order Timeline */}
        {order.tracking && order.tracking.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Order Timeline</h2>
            <div className="space-y-4">
              {order.tracking.map((update, index) => (
                <div
                  key={update._id}
                  className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex-shrink-0">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        STATUS_COLORS[update.status]
                      }`}
                    >
                      {STATUS_ICONS[update.status]}
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{update.message}</p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(update.timestamp), "PPp")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
