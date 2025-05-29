// src/app/published-books/Components/modals.jsx
"use client";
import { useState } from "react";
import { format } from "date-fns";
import Link from "next/link";
import Image from "next/image";

// 1) Details Modal
export function OrderDetailsModal({ order, onClose }) {
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
  if (!order) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-2xl w-full p-6 relative">
        <button
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-900"
          onClick={onClose}
        >
          ✖
        </button>
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold">Order #{order.orderId}</h2>
            <p className="text-gray-500">
              Placed on {format(new Date(order.createdAt), "PPP")}
            </p>
          </div>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-2">Customer Information</h3>
            <div className="space-y-2">
              <p>
                <span className="text-gray-500">Name:</span> {order.buyerName}
              </p>
              <p>
                <span className="text-gray-500">Email:</span> {order.buyerEmail}
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
                <span className="text-gray-500">Payment Method:</span>{" "}
                {order.paymentMethod}
              </p>
              <p>
                <span className="text-gray-500">Status:</span>{" "}
                <span
                  className={`px-2 py-1 rounded-full text-sm ${
                    STATUS_COLORS[order.status]
                  }`}
                >
                  {STATUS_ICONS[order.status]} {order.status}
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="font-semibold mb-2">Items</h3>
          <div className="space-y-4">
            {order.items.map((item) => (
              <div key={item._id} className="flex items-center gap-4">
                <Image
                  src={item.book?.coverImage}
                  alt={item.book?.title}
                  width={60}
                  height={90}
                  className="rounded-lg object-cover"
                />
                <div>
                  <p className="font-medium">{item.book?.title}</p>
                  <p className="text-gray-500">
                    {item.qty} x {item.price} BDT
                  </p>
                </div>
              </div>
            ))}
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
                  new Date(order.tracking[order.tracking.length - 1].timestamp),
                  "PPp"
                )}
              </p>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            Close
          </button>
          <Link
            href={`/orders/${order._id}`}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            View Full Details
          </Link>
        </div>
      </div>
    </div>
  );
}

// 2) Edit Modal
export function EditOrderModal({ order, onClose, onSaved }) {
  const [form, setForm] = useState({
    status: order.status,
    paymentStatus: order.paymentStatus,
    deliveryAddress: order.deliveryAddress,
    deliveryPhone: order.deliveryPhone,
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await fetch(`/api/orders/${order._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="bg-white overflow-auto h-5/6 dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full p-6 relative">
        <button
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-900"
          onClick={onClose}
        >
          ✖
        </button>
        <h2 className="text-2xl font-bold mb-4">Edit Order</h2>
        <label className="block mb-2">
          Status:
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="w-full border dark:bg-black px-2 py-1 rounded mt-1"
          >
            <option>pending</option>
            <option>delivery</option>
            <option>failed</option>
            <option>cancelled</option>
          </select>
        </label>
        <label className="block mb-2">
          Payment:
          <select
            value={form.paymentStatus}
            onChange={(e) =>
              setForm({ ...form, paymentStatus: e.target.value })
            }
            className="w-full border dark:bg-black px-2 py-1 rounded mt-1"
          >
            <option>Unpaid</option>
            <option>Paid</option>
          </select>
        </label>
        <label className="block mb-2">
          Address:
          <textarea
            rows={2}
            value={form.deliveryAddress}
            onChange={(e) =>
              setForm({ ...form, deliveryAddress: e.target.value })
            }
            className="w-full border dark:bg-black px-2 py-1 rounded mt-1"
          />
        </label>
        <label className="block mb-4">
          Phone:
          <input
            type="text"
            value={form.deliveryPhone}
            onChange={(e) =>
              setForm({ ...form, deliveryPhone: e.target.value })
            }
            className="w-full border dark:bg-black px-2 py-1 rounded mt-1"
          />
        </label>
        <button
          onClick={save}
          disabled={saving}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

// 3) Send Email Modal
export function SendEmailModal({ order, onClose }) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const send = async () => {
    setSending(true);
    await fetch(`/api/orders/${order._id}/send-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, body }),
    });
    setSending(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full p-6 relative">
        <button
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-900"
          onClick={onClose}
        >
          ✖
        </button>
        <h2 className="text-2xl font-bold mb-4">Send Custom Email</h2>
        <label className="block mb-2">
          To: <span className="font-mono">{order.buyerEmail}</span>
        </label>
        <label className="block mb-2">
          Subject:
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full border px-2 py-1 rounded mt-1"
          />
        </label>
        <label className="block mb-4">
          Message:
          <textarea
            rows={4}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full border px-2 py-1 rounded mt-1"
          />
        </label>
        <button
          onClick={send}
          disabled={sending}
          className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600"
        >
          {sending ? "Sending…" : "Send Email"}
        </button>
      </div>
    </div>
  );
}
