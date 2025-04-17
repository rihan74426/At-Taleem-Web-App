"use client";
import { useEffect, useState } from "react";
import {
  OrderDetailsModal,
  EditOrderModal,
  SendEmailModal,
} from "../Components/orderModals";
import Link from "next/link";
import { format } from "date-fns";
import Image from "next/image";

export default function OrderListPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [books, setBooks] = useState([]);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showEmail, setShowEmail] = useState(false);

  useEffect(() => {
    (async () => {
      const [oRes, bRes] = await Promise.all([
        fetch("/api/orders"),
        fetch("/api/books"),
      ]);
      const { orders } = await oRes.json();
      const { books } = await bRes.json();
      setOrders(orders);
      setBooks(books);
      setLoading(false);
    })();
  }, [search, statusFilter, paymentFilter, page]);

  const bookMap = Object.fromEntries(books.map((b) => [b._id, b]));

  const doAction = async (orderId, action) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action),
      });
      if (!res.ok) throw new Error("Failed to update order");

      const { order } = await res.json();

      // Replace only the updated order in state
      setOrders((prev) => prev.map((o) => (o._id === orderId ? order : o)));
    } catch (err) {
      console.error(err);
      // optionally show a toast / error message
    }
  };

  if (loading) return <p className="p-4 min-h-screen">Loading orders…</p>;

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen">
      <h1 className="text-3xl font-bold mb-4">Manage Orders</h1>

      {/* Filters */}

      <div className="space-y-6">
        {orders.map((o) => {
          // helper to look up book details
          const getBook = (id) => books.find((b) => b._id === id) || {};

          return (
            <div
              key={o._id}
              className="bg-white dark:bg-gray-800 border rounded-lg shadow-sm overflow-hidden"
            >
              {/* ── Header ── */}
              <div className="px-6 py-4 md:flex md:justify-between md:items-start">
                {/* Left block */}
                <div className="space-y-1">
                  <p className="text-sm">
                    <span className="font-semibold">Invoice:</span>{" "}
                    <span className="font-mono">{o._id}</span>
                  </p>
                  <p className="text-sm">
                    <span className="font-semibold">Status:</span>{" "}
                    <span
                      className={
                        o.status === "pending"
                          ? "text-yellow-600"
                          : o.status === "delivery"
                          ? "text-blue-600"
                          : o.status === "cancelled"
                          ? "text-red-600"
                          : "text-green-600"
                      }
                    >
                      {o.status}
                    </span>
                  </p>
                  <p className="text-sm">
                    <span className="font-semibold">Customer:</span>{" "}
                    {o.buyerName}
                  </p>
                  <p className="text-sm">
                    <span className="font-semibold">Contact:</span>{" "}
                    {o.deliveryPhone}
                  </p>
                  <p className="text-sm">
                    <span className="font-semibold">Email:</span>{" "}
                    <a href={`mailto:${o.buyerEmail}`} className="underline">
                      {o.buyerEmail}
                    </a>
                  </p>
                  <p className="text-sm">
                    <span className="font-semibold">Order Date:</span>{" "}
                    {format(new Date(o.createdAt), "PP p")}
                  </p>
                </div>

                {/* Right block */}
                <div className="mt-4 md:mt-0 space-y-1">
                  <p className="text-sm">
                    <span className="font-semibold">Total bill:</span>{" "}
                    <span className="font-mono">{o.amount} BDT</span>
                  </p>
                  <p className="text-sm">
                    <span className="font-semibold">Payment status:</span>{" "}
                    <span
                      className={
                        o.paymentStatus === "Paid"
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      {o.paymentStatus}
                    </span>
                  </p>
                  <p className="text-sm">
                    <span className="font-semibold">Delivery Addr:</span>{" "}
                    {o.deliveryAddress}
                  </p>
                </div>
              </div>

              {/* ── Actions ── */}
              <div className="px-6 py-2 border-t flex flex-wrap gap-2 bg-gray-50 dark:bg-gray-700">
                <button
                  className="px-2 py-1 bg-blue-200 dark:bg-blue-500 rounded hover:bg-blue-300"
                  onClick={() => {
                    setSelected(o);
                    setShowDetails(true);
                  }}
                >
                  Details
                </button>
                <button
                  className="px-2 py-1 bg-yellow-200 rounded dark:bg-yellow-500 hover:bg-yellow-300"
                  onClick={() => {
                    setSelected(o);
                    setShowEdit(true);
                  }}
                >
                  Edit
                </button>
                {o.status !== "cancelled" && (
                  <button
                    className="px-2 py-1 bg-red-200 rounded dark:bg-red-500 hover:bg-red-300"
                    onClick={() => doAction(o._id, { status: "cancelled" })}
                  >
                    Cancel
                  </button>
                )}
                {o.paymentStatus === "Unpaid" && (
                  <button
                    className="px-2 py-1 bg-green-200 rounded dark:bg-green-500 hover:bg-green-300"
                    onClick={() => doAction(o._id, { paymentStatus: "Paid" })}
                  >
                    Mark as Paid
                  </button>
                )}
                {o.status !== "delivery" && (
                  <button
                    className="px-2 py-1 bg-purple-200 rounded dark:bg-purple-500 hover:bg-purple-300"
                    onClick={() => doAction(o._id, { status: "delivery" })}
                  >
                    Mark Done
                  </button>
                )}
                <button
                  className="px-2 py-1 bg-indigo-200 dark:bg-indigo-500 rounded hover:bg-indigo-300"
                  onClick={() => {
                    setSelected(o);
                    setShowEmail(true);
                  }}
                >
                  Email
                </button>
              </div>

              {/* ── Items Table ── */}
              <div className="p-6 overflow-x-auto">
                <table className="w-full table-auto text-sm">
                  <thead className="bg-gray-100 dark:bg-gray-700">
                    <tr>
                      <th className="p-2 text-left">Product</th>
                      <th className="p-2 text-left">Qty</th>
                      <th className="p-2 text-left">Unit Price</th>
                      <th className="p-2 text-left">Total Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {o.items.map(({ bookId, qty }) => {
                      const b = getBook(bookId);
                      return (
                        <tr key={bookId} className="border-b">
                          <td className="p-2 flex items-center gap-3">
                            <Image
                              src={b.coverImage}
                              alt={b.title}
                              width={40}
                              height={56}
                              className="object-cover rounded"
                            />
                            <span>{b.title || bookId}</span>
                          </td>
                          <td className="p-2">{qty}</td>
                          <td className="p-2">{b.price || 0} BDT</td>
                          <td className="p-2">{(b.price || 0) * qty} BDT</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination (simple prev/next) */}
      <div className="mt-4 flex justify-center gap-4">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="px-3 py-1 border rounded disabled:opacity-50"
          disabled={page === 1}
        >
          ← Prev
        </button>
        <span>Page {page}</span>
        <button
          onClick={() => setPage((p) => p + 1)}
          className="px-3 py-1 border rounded"
        >
          Next →
        </button>
      </div>

      {/* Modals */}
      {showDetails && (
        <OrderDetailsModal
          order={selected}
          onClose={() => setShowDetails(false)}
        />
      )}
      {showEdit && (
        <EditOrderModal
          order={selected}
          onClose={() => setShowEdit(false)}
          onSaved={fetchOrders}
        />
      )}
      {showEmail && (
        <SendEmailModal order={selected} onClose={() => setShowEmail(false)} />
      )}
    </div>
  );
}
