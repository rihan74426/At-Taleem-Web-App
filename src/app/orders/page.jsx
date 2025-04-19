"use client";

// Import necessary hooks and components
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import {
  OrderDetailsModal,
  EditOrderModal,
  SendEmailModal,
} from "../components/orderModals";
import { FiChevronDown } from "react-icons/fi";
import Loader from "../Components/Loader";

export default function OrderListPage() {
  // States to manage orders, books, loading, and filters
  const [orders, setOrders] = useState([]);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [page, setPage] = useState(1);

  // Track which order's action panel is open
  const [openActionsId, setOpenActionsId] = useState(null);

  // Modal control states
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showEmail, setShowEmail] = useState(false);

  // Fetch orders and books based on filters and pagination
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (statusFilter) params.append("status", statusFilter);
      if (paymentFilter) params.append("paymentStatus", paymentFilter);
      params.append("page", page.toString());

      const [oRes, bRes] = await Promise.all([
        fetch(`/api/orders?${params.toString()}`),
        fetch(`/api/books`),
      ]);
      const oData = await oRes.json();
      const bData = await bRes.json();
      setOrders(oData.orders || []);
      setBooks(bData.books || []);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, paymentFilter, page]);

  // Initial and dependent fetch
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Update order status or payment state
  const doAction = async (orderId, action) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action),
      });
      if (!res.ok) throw new Error("Failed to update order");
      const { order } = await res.json();
      setOrders((prev) => prev.map((o) => (o._id === order._id ? order : o)));
    } catch (err) {
      console.error(err);
    }
  };

  // Map bookId to details for quick lookup
  const bookMap = books.reduce((acc, b) => ({ ...acc, [b._id]: b }), {});

  if (loading)
    return (
      <div className="flex items-center place-content-center min-h-screen">
        <Loader />
      </div>
    );

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gray-50 dark:bg-gray-800 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100">
        Manage Orders
      </h1>

      {/* Filter controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="Search invoice or customer..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="flex-1 border p-2 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="border p-2 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="delivery">Delivery</option>
          <option value="cancelled">Cancelled</option>
          <option value="paid">Paid</option>
        </select>
        <select
          value={paymentFilter}
          onChange={(e) => {
            setPaymentFilter(e.target.value);
            setPage(1);
          }}
          className="border p-2 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
        >
          <option value="">All Payments</option>
          <option value="Unpaid">Unpaid</option>
          <option value="Paid">Paid</option>
        </select>
      </div>

      {/* Orders list */}
      <div className="space-y-6">
        {orders.map((o) => (
          <div
            key={o._id}
            className="bg-white dark:bg-gray-900 border rounded-lg shadow-sm overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-4 md:flex md:justify-between md:items-start">
              {/* Left info block */}
              <div className="space-y-1">
                <p className="text-sm text-gray-700 dark:text-gray-200">
                  <span className="font-semibold">Invoice:</span>{" "}
                  <span className="font-mono">{o._id}</span>
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-200">
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
                <p className="text-sm text-gray-700 dark:text-gray-200">
                  <span className="font-semibold">Customer:</span> {o.buyerName}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-200">
                  <span className="font-semibold">Contact:</span>{" "}
                  {o.deliveryPhone}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-200">
                  <span className="font-semibold">Email:</span>{" "}
                  <a href={`mailto:${o.buyerEmail}`} className="underline">
                    {o.buyerEmail}
                  </a>
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-200">
                  <span className="font-semibold">Order Date:</span>{" "}
                  {format(new Date(o.createdAt), "PP p")}
                </p>
              </div>

              {/* Right info block */}
              <div className="mt-4 md:mt-0 space-y-1 text-right md:text-left">
                <button
                  onClick={() =>
                    setOpenActionsId(openActionsId === o._id ? null : o._id)
                  }
                  className="flex items-center px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Actions
                  <FiChevronDown
                    className={`ml-1 transition-transform ${
                      openActionsId === o._id ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {/* ── Animated dropdown panel ── */}
                <div
                  className={`
      absolute right-6  mt-1 w-56 bg-white dark:bg-gray-900
      rounded-md shadow-lg overflow-hidden
      transition-[max-height] duration-300
      ${openActionsId === o._id ? "max-h-68" : "max-h-0"}
    `}
                >
                  <div className="flex flex-col gap-2 p-4">
                    <button
                      onClick={() => {
                        setSelectedOrder(o);
                        setShowDetails(true);
                      }}
                      className="px-3 py-1 bg-blue-200 dark:bg-blue-500 rounded hover:bg-blue-300"
                    >
                      Details
                    </button>
                    <button
                      onClick={() => {
                        setSelectedOrder(o);
                        setShowEdit(true);
                      }}
                      className="px-3 py-1 bg-yellow-200 dark:bg-yellow-500 rounded hover:bg-yellow-300"
                    >
                      Edit
                    </button>
                    {o.status !== "cancelled" && (
                      <button
                        onClick={() => doAction(o._id, { status: "cancelled" })}
                        className="px-3 py-1 bg-red-200 dark:bg-red-500 rounded hover:bg-red-300"
                      >
                        Cancel
                      </button>
                    )}
                    {o.paymentStatus === "Unpaid" && (
                      <button
                        onClick={() =>
                          doAction(o._id, { paymentStatus: "Paid" })
                        }
                        className="px-3 py-1 bg-green-200 dark:bg-green-500 rounded hover:bg-green-300"
                      >
                        Mark Paid
                      </button>
                    )}
                    {o.status !== "delivery" && (
                      <button
                        onClick={() => doAction(o._id, { status: "delivery" })}
                        className="px-3 py-1 bg-purple-200 dark:bg-purple-500 rounded hover:bg-purple-300"
                      >
                        Mark Delivery
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSelectedOrder(o);
                        setShowEmail(true);
                      }}
                      className="px-3 py-1 bg-indigo-200 dark:bg-indigo-500 rounded hover:bg-indigo-300"
                    >
                      Email
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-200">
                  <span className="font-semibold">Total Bill:</span>{" "}
                  <span className="font-mono">{o.amount} BDT</span>
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-200">
                  <span className="font-semibold">Payment:</span>{" "}
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
                <p className="text-sm text-gray-700 dark:text-gray-200">
                  <span className="font-semibold">Delivery Addr:</span>{" "}
                  {o.deliveryAddress}
                </p>
              </div>
            </div>

            {/* Actions toggle button */}

            {/* Items table */}
            <div className="p-6 overflow-x-auto">
              <table className="w-full table-auto text-sm">
                <thead className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                  <tr>
                    <th className="p-2 text-left">Product</th>
                    <th className="p-2 text-left">Qty</th>
                    <th className="p-2 text-left">Unit Price</th>
                    <th className="p-2 text-left">Total Price</th>
                  </tr>
                </thead>
                <tbody>
                  {o.items.map(({ bookId, qty }) => {
                    const b = bookMap[bookId] || {};
                    return (
                      <tr key={bookId} className="border-b">
                        <td className="p-2 flex items-center gap-3">
                          <Image
                            src={b.coverImage || "/placeholder.png"}
                            alt={b.title || ""}
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
        ))}
      </div>

      {/* Pagination controls */}
      <div className="mt-4 flex justify-center gap-4">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          ← Prev
        </button>
        <span>Page {page}</span>
        <button
          onClick={() => setPage((p) => p + 1)}
          className="px-3 py-1 border rounded"
        >
          Next →
        </button>
      </div>

      {/* Modals */}
      {showDetails && selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => {
            setSelectedOrder(null);
            setShowDetails(false);
          }}
        />
      )}
      {showEdit && selectedOrder && (
        <EditOrderModal
          order={selectedOrder}
          onClose={() => {
            setSelectedOrder(null);
            setShowEdit(false);
          }}
          onSaved={fetchOrders}
        />
      )}
      {showEmail && selectedOrder && (
        <SendEmailModal
          order={selectedOrder}
          onClose={() => {
            setSelectedOrder(null);
            setShowEmail(false);
          }}
        />
      )}
    </div>
  );
}
