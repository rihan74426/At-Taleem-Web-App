// src/app/orders/[id]/payment-failed/page.jsx
"use client";
import { useParams, useRouter } from "next/navigation";

export default function PaymentFailedPage() {
  const { id } = useParams();
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold mb-4 text-red-600">Payment Failed</h1>
      <p className="mb-6">
        Unfortunately, your payment for order{" "}
        <span className="font-mono">{id}</span> did not go through.
      </p>
      <button
        onClick={() => router.push(`/orders/${id}`)}
        className="bg-gray-800 text-white px-6 py-2 rounded mb-4"
      >
        View Order & Retry
      </button>
      <button
        onClick={() => router.push("/published-books")}
        className="text-blue-500 underline"
      >
        Browse More Books
      </button>
    </div>
  );
}
