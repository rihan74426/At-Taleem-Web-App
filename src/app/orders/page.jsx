"use client";
import { useEffect, useState } from "react";
import {
  OrderDetailsModal,
  EditOrderModal,
  SendEmailModal,
} from "../Components/orderModals";
import Link from "next/link";
import { format } from "date-fns";

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
    // e.g. action = { status: "cancelled" } or { paymentStatus: "Paid" }
    const res = await fetch(`/api/orders/${orderId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(action),
    });
    const { order } = await res.json();
    setOrders((prevOrders) => {
      return prevOrders.map((o) => {
        if (o._id === orderId) {
          return order;
        }
      });
    });
  };

  if (loading) return <p className="p-4 min-h-screen">Loading orders…</p>;

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen">
      <h1 className="text-3xl font-bold mb-4">Manage Orders</h1>

      {/* Filters */}

      <table className="w-full table-auto border">
        <thead className="bg-gray-100">
          <tr>
            {[
              "Order ID",
              "Buyer",
              "Date",
              "Items",
              "Amount",
              "Status",
              "Paid",
              "Actions",
            ].map((h) => (
              <th key={h} className="p-2 border">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o._id} className="hover:bg-gray-50">
              <td className="p-2 border text-sm font-mono">
                {o.items.map((item) => {
                  const b = books.map((book) => book._id === item.bookId);
                  return <span key={item._id}>{item.qty}</span>;
                })}
              </td>
              <td className="p-2 border">
                {o.buyerName}
                <br />
                <span className="text-xs text-gray-500">{o.buyerEmail}</span>
              </td>
              <td className="p-2 border">
                {format(new Date(o.createdAt), "PP p")}
              </td>
              <td className="p-2 border text-center">{o.items.length}</td>
              <td className="p-2 border text-right">{o.amount} BDT</td>
              <td className="p-2 border">{o.status}</td>
              <td className="p-2 border">{o.paymentStatus}</td>
              <td className="p-2 border space-x-1 text-center">
                <button
                  className="text-blue-500 hover:underline text-sm"
                  onClick={() => setViewOrder(o)}
                >
                  Details
                </button>
                <button
                  className="text-green-600 hover:underline text-sm"
                  onClick={() => handleAction(o._id, { status: "delivery" })}
                >
                  🚚
                </button>
                <button
                  className="text-green-800 hover:underline text-sm"
                  onClick={() => handleAction(o._id, { paymentStatus: "Paid" })}
                >
                  ✅
                </button>
                <button
                  className="text-yellow-600 hover:underline text-sm"
                  onClick={() => {
                    setEditOrder(o);
                    setEditData({ status: o.status });
                  }}
                >
                  ✏️
                </button>
                <button
                  className="text-red-600 hover:underline text-sm"
                  onClick={() => handleAction(o._id, { status: "cancelled" })}
                >
                  ❌
                </button>
                <button
                  className="text-purple-600 hover:underline text-sm"
                  onClick={() => {
                    setEmailOrder(o);
                    setEmailData({ subject: "", body: "" });
                  }}
                >
                  📨
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

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
