// src/app/Components/CheckoutModal.jsx
"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

export default function CheckoutModal({
  open,
  onClose,
  items, // [{ book, qty }]
  bundlePrice, // optional: special bundle price
}) {
  const router = useRouter();
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, isSignedIn } = useUser();

  const subtotal = items.reduce(
    (sum, { book, qty }) => sum + book.price * qty,
    0
  );
  const total = bundlePrice ? bundlePrice : subtotal;
  const savings = subtotal - total;

  // Reset when opened
  useEffect(() => {
    if (open) {
      setAddress("");
      setPhone("");
      setError("");
      setLoading(false);
    }
  }, [open]);

  const handleCheckout = async () => {
    if (!address.trim() || !phone.trim()) {
      setError("Please provide address and phone.");
      return;
    }
    setLoading(true);
    try {
      const orderData = {
        items: items.map(({ book, qty }) => ({
          bookId: book._id,
          qty,
        })),
        userId: user.id,
        buyerName: user.fullName,
        buyerEmail: user.primaryEmailAddress.emailAddress,
        deliveryAddress: address,
        deliveryPhone: phone,
      };
      if (bundlePrice) orderData.bundlePrice = bundlePrice;
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });
      if (!res.ok) {
        const { error: msg } = await res.json().catch(() => ({}));
        throw new Error(msg || "Failed to create order");
      }
      const { paymentUrl } = await res.json();
      onClose();
      router.push(paymentUrl);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-auto p-6">
        <button
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
          onClick={onClose}
        >
          ✖
        </button>
        <h2 className="text-2xl font-bold mb-4">Checkout</h2>

        {/* Items Table */}
        <table className="w-full mb-4 text-left">
          <thead>
            <tr>
              <th className="pb-2">Cover</th>
              <th className="pb-2">Title</th>
              <th className="pb-2">Qty</th>
              <th className="pb-2">Price</th>
            </tr>
          </thead>
          <tbody>
            {items.map(({ book, qty }) => (
              <tr key={book._id} className="border-t">
                <td className="py-2">
                  <Image
                    src={book.coverImage}
                    alt={book.title}
                    width={40}
                    height={60}
                    className="object-cover rounded"
                  />
                </td>
                <td className="py-2">{book.title}</td>
                <td className="py-2">{qty}</td>
                <td className="py-2">{book.price * qty} BDT</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Summary */}
        <div className="mb-4">
          <p>Subtotal: {subtotal} BDT</p>
          {!bundlePrice && (
            <>
              <p>Bundle Price: {total} BDT</p>
              <p className="text-green-600">You save: {savings} BDT</p>
            </>
          )}
        </div>

        {/* Delivery Info */}
        <div className="mb-4">
          <h3 className="font-semibold mb-2">Delivery Information</h3>
          <textarea
            className="w-full border p-2 mb-2 dark:bg-black"
            placeholder="Delivery Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={2}
          />
          <input
            className="w-full border p-2 dark:bg-black"
            placeholder="Phone Number"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        {error && <p className="text-red-500 mb-2">{error}</p>}

        <button
          onClick={handleCheckout}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Processing..." : "Confirm & Pay"}
        </button>
      </div>
    </div>
  );
}
