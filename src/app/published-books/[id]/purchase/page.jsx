"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";

export default function BookPurchasePage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, isSignedIn } = useUser();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState("sslcommerz");
  const [error, setError] = useState(null);

  // Fetch book details
  useEffect(() => {
    const fetchBook = async () => {
      try {
        const res = await fetch(`/api/books?id=${id}`);
        if (!res.ok) throw new Error("Failed to fetch book");
        const data = await res.json();
        if (!data.book) throw new Error("Book not found");
        setBook(data.book);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchBook();
  }, [id]);

  const handlePurchase = async () => {
    if (!isSignedIn) {
      alert("Please sign in to purchase.");
      return;
    }
    try {
      const orderData = {
        bookId: id,
        userId: user.id,
        buyerName: user.fullName,
        buyerEmail: user.primaryEmailAddress.emailAddress,
        paymentMethod,
      };
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });
      if (res.ok) {
        const data = await res.json();
        // Redirect user to payment gateway
        router.push(data.paymentUrl);
      } else {
        const errData = await res.json();
        setError(errData.error || "Failed to initiate purchase.");
      }
    } catch (err) {
      console.error("Error purchasing book:", err);
      setError("Error purchasing book.");
    }
  };

  if (loading) return <p className="text-center">Loading...</p>;
  if (error) return <p className="text-center text-red-500">{error}</p>;
  if (!book) return <p className="text-center">Book not found</p>;

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Book Cover */}
      <div className="relative w-full h-96 mb-6">
        <Image
          src={book.coverImage}
          alt={book.title}
          fill
          className="object-cover rounded shadow-lg"
          priority
        />
      </div>

      {/* Book Details */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{book.title}</h1>
        <p className="text-xl text-gray-700">by {book.author}</p>
        <p className="mt-4 text-gray-600">{book.description}</p>
        <p className="mt-2 text-lg font-semibold">Price: ${book.price}</p>
      </div>

      {/* Payment Options */}
      <div className="mb-6">
        <label className="block mb-1 font-semibold">
          Select Payment Method:
        </label>
        <select
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          className="border p-2 rounded dark:bg-black"
        >
          <option value="sslcommerz">SSLCommerz</option>
          <option value="mobile-banking">Mobile Banking</option>
        </select>
      </div>

      {/* Purchase Button */}
      <button
        onClick={handlePurchase}
        className="bg-blue-500 text-white px-6 py-3 rounded text-xl"
      >
        Buy Now
      </button>
    </div>
  );
}
