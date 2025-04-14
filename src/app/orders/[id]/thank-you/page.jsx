// src/app/orders/[id]/thank-you/page.jsx
"use client";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function ThankYouPage() {
  const { id } = useParams();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold mb-4">Thank you for your purchase!</h1>
      <p className="mb-6">
        Your order <span className="font-mono">{id}</span> has been successfully
        paid.
      </p>
      <Link href={`/orders/${id}`}>
        <a className="bg-blue-500 text-white px-6 py-2 rounded">
          View Order Details
        </a>
      </Link>
    </div>
  );
}
