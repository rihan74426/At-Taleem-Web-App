// src/app/published-books/Components/modals.jsx
"use client";
import { useState } from "react";

// 1) Details Modal
export function OrderDetailsModal({ order, onClose }) {
  if (!order) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-lg w-full p-6 relative">
        <button
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-900"
          onClick={onClose}
        >
          ✖
        </button>
        <h2 className="text-2xl font-bold mb-4">Order #{order._id}</h2>
        <p>
          <strong>Buyer:</strong> {order.buyerName} ({order.buyerEmail})
        </p>
        <p>
          <strong>Delivery:</strong> {order.deliveryAddress}, 📞{" "}
          {order.deliveryPhone}
        </p>
        <p>
          <strong>Status:</strong> {order.status}
        </p>
        <p>
          <strong>Payment:</strong> {order.paymentStatus}
        </p>
        <p className="mt-4 font-semibold">Items:</p>
        <ul className="list-disc pl-5">
          {order.items.map(({ bookId, qty }) => (
            <li key={bookId}>
              {bookId} × {qty}
            </li>
          ))}
        </ul>
        <p className="mt-4">
          <strong>Total:</strong> {order.amount} BDT
        </p>
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
