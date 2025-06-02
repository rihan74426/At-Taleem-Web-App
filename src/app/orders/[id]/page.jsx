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
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header Skeleton */}
          <div className="flex justify-between items-start mb-8">
            <div className="space-y-2">
              <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
            <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>

          {/* Order Status Skeleton */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Customer Information Skeleton */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
            <div className="h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </div>
              <div className="space-y-3">
                <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Order Items Skeleton */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
            <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-[60px] h-[90px] bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t">
              <div className="flex justify-between items-center">
                <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Order Timeline Skeleton */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4"></div>
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-full animate-pulse"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
                    <div className="h-3 w-1/3 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
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
            <h1 className="text-3xl font-bold">Order #{order._id}</h1>
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
          {order.paymentDetails && (
            <div className="mt-4 pt-4 border-t">
              <h3 className="text-lg font-semibold mb-2">Payment Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p>
                    <span className="text-gray-500">Transaction ID:</span>{" "}
                    {order.paymentDetails.transactionId}
                  </p>
                  <p>
                    <span className="text-gray-500">Paid At:</span>{" "}
                    {order.paymentDetails.paidAt
                      ? format(new Date(order.paymentDetails.paidAt), "PPP")
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <p>
                    <span className="text-gray-500">Validation ID:</span>{" "}
                    {order.paymentDetails.validationId || "N/A"}
                  </p>
                  <p>
                    <span className="text-gray-500">Amount Paid:</span>{" "}
                    {order.paymentDetails.amount || order.amount} BDT
                  </p>
                </div>
              </div>
            </div>
          )}
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
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Book
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-4 py-2 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-4 py-2 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Unit Price
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Subtotal
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {order.items.map((item) => (
                  <tr
                    key={item._id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    <td className="px-4 py-3">
                      <div className="w-14 h-20 flex items-center justify-center">
                        <Image
                          src={item.bookId?.coverImage}
                          alt={item.bookId?.title}
                          width={56}
                          height={80}
                          className="rounded-lg object-cover border border-gray-200 dark:border-gray-700"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium">{item.bookId?.title}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-block bg-gray-100 dark:bg-gray-700 rounded px-2 py-1 text-sm font-semibold">
                        {item.qty}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-gray-700 dark:text-gray-200">
                        {item.price} BDT
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-semibold">
                        {(item.qty * item.price).toFixed(2)} BDT
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
                  key={index}
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
