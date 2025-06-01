// src/app/Components/CheckoutModal.jsx
"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { toast } from "react-hot-toast";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";

// Validation schemas
const phoneRegex = /^(?:\+88|88)?(01[3-9]\d{8})$/;
const addressSchema = z
  .string()
  .min(10, "Address must be at least 10 characters");

const validationSchema = z.object({
  address: addressSchema,
  phone: z.string().regex(phoneRegex, "Invalid Bangladeshi phone number"),
});

export default function CheckoutModal({
  open,
  onClose,
  items, // [{ book, qty }]
  bundlePrice, // optional: special bundle price
}) {
  const router = useRouter();
  const { user, isSignedIn } = useUser();

  // Form states
  const [formData, setFormData] = useState({
    address: "",
    phone: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const subtotal = items.reduce(
    (sum, { book, qty }) => sum + book.price * qty,
    0
  );
  const total = bundlePrice ? bundlePrice : subtotal;
  const savings = subtotal - total;

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setFormData({ address: "", phone: "" });
      setErrors({});
      setLoading(false);
    }
  }, [open]);

  // Validate form data
  const validateForm = () => {
    try {
      validationSchema.parse({
        address: formData.address,
        phone: formData.phone,
      });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors = {};
        error.errors.forEach((err) => {
          newErrors[err.path[0]] = err.message;
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Handle payment submission
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const orderData = {
        items: items.map(({ book, qty }) => ({
          bookId: book._id,
          qty,
          price: book.price,
        })),
        userId: user.id,
        buyerName: user.fullName,
        buyerEmail: user.primaryEmailAddress.emailAddress,
        deliveryAddress: formData.address,
        deliveryPhone: formData.phone,
      };

      if (bundlePrice) orderData.bundlePrice = bundlePrice;

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create order");
      }

      const { paymentUrl } = await res.json();
      window.location.href = paymentUrl;
    } catch (err) {
      toast.error(err.message);
      setErrors({ submit: err.message });
    } finally {
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

        <div>
          <h2 className="text-2xl font-bold mb-4">Order Details</h2>

          {/* Items Table */}
          <div className="mb-6 overflow-x-auto">
            <table className="w-full text-left">
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
          </div>

          {/* Summary */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="font-semibold">Subtotal: {subtotal} BDT</p>
            {bundlePrice && (
              <>
                <p className="font-semibold">Bundle Price: {total} BDT</p>
                <p className="text-green-600">You save: {savings} BDT</p>
              </>
            )}
          </div>

          {/* Delivery Info */}
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Delivery Information</h3>
            <div className="space-y-4">
              <div>
                <textarea
                  name="address"
                  className={`w-full border p-2 rounded dark:bg-gray-700 ${
                    errors.address ? "border-red-500" : ""
                  }`}
                  placeholder="Delivery Address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows={2}
                />
                {errors.address && (
                  <p className="text-red-500 text-sm mt-1">{errors.address}</p>
                )}
              </div>
              <div>
                <input
                  name="phone"
                  className={`w-full border p-2 rounded dark:bg-gray-700 ${
                    errors.phone ? "border-red-500" : ""
                  }`}
                  placeholder="Phone Number"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                />
                {errors.phone && (
                  <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={handlePaymentSubmit}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Processing..." : "Proceed to Payment"}
          </button>
        </div>

        {errors.submit && (
          <p className="text-red-500 text-center mt-4">{errors.submit}</p>
        )}
      </div>
    </div>
  );
}
