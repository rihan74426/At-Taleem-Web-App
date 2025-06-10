// src/app/Components/CheckoutModal.jsx
"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { toast } from "react-hot-toast";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import ResponseModal from "./ResponseModal";

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
  const [modal, setModal] = useState({
    isOpen: false,
    message: "",
    status: "",
  });
  const showModal = (m, s) => setModal({ isOpen: true, message: m, status: s });

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
            <div className="bg-blue-50 dark:bg-blue-900/30 p-6 rounded-xl border border-blue-200 dark:border-blue-800">
              <h3 className="text-xl font-semibold mb-4 text-blue-800 dark:text-blue-200">
                অর্ডারিং প্রসেস নিয়ে কাজ চলমান!
              </h3>
              <div className="space-y-4 text-blue-700 dark:text-blue-300">
                <p className="leading-relaxed">
                  আমরা আপাতত ম্যানুয়ালি অর্ডার চলমান রেখেছি। অর্ডারের সংখ্যা ও
                  অনুপাতের উপর ভিত্তি করে আমরা এটা অটোমেটিক করব ইনশাআল্লাহ!
                </p>
                <p className="leading-relaxed">
                  ম্যানুয়ালি অর্ডার করতে নিম্মে দেওয়া ফেসবুক আইডি লিংক অথবা
                  হোয়াটসঅ্যাপ নাম্বারে নক করুন।
                </p>
                <p className="leading-relaxed">সাথে থাকার জন্য ধন্যবাদ!</p>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <a
                    href="https://www.facebook.com/saifullah.mohammod.7"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-[#1877F2] text-white rounded-lg hover:bg-[#1877F2]/90 transition-colors"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    Facebook Profile
                  </a>
                  <a
                    href="https://www.facebook.com/profile.php?id=100064076645371"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-[#1877F2] text-white rounded-lg hover:bg-[#1877F2]/90 transition-colors"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    Facebook Page
                  </a>
                </div>

                <div className="flex items-center justify-center gap-2">
                  <a
                    href="https://wa.me/+8801845697963"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-[#25D366] text-white rounded-lg hover:bg-[#25D366]/90 transition-colors"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    WhatsApp Chat
                  </a>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText("01845697963");
                      showModal("Phone number copied to clipboard!", "success");
                    }}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                      />
                    </svg>
                    Copy Number
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Keep the commented code for future reference */}
          {/* <h3 className="font-semibold mb-2">Delivery Information</h3>
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
          </div> */}

          {/* <button
            onClick={handlePaymentSubmit}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Processing..." : "Proceed to Payment"}
          </button> */}
        </div>

        {errors.submit && (
          <p className="text-red-500 text-center mt-4">{errors.submit}</p>
        )}
      </div>
      <ResponseModal
        isOpen={modal.isOpen}
        message={modal.message}
        status={modal.status}
        onClose={() => setModal((m) => ({ ...m, isOpen: false }))}
      />
    </div>
  );
}
