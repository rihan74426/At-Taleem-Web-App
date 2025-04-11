// src/app/published-books/[id]/purchase/page.jsx
"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";

export default function BookPurchasePage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, isSignedIn } = useUser();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [useProfile, setUseProfile] = useState(true);

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

  useEffect(() => {
    // if Clerk user has metadata address/phone, prefill:
    if (user) {
      const meta = user.publicMetadata;
      if (meta.deliveryAddress) {
        setAddress(meta.deliveryAddress);
      } else {
        setUseProfile(false);
      }
      if (meta.phoneNumber) {
        setPhone(meta.phoneNumber);
      }
    }
  }, [user]);

  const handlePurchase = async () => {
    if (!isSignedIn) {
      return alert("Please sign in first.");
    }
    if (!address.trim() || !phone.trim()) {
      return alert("Please provide address & phone.");
    }

    const orderData = {
      bookId: id,
      userId: user.id,
      buyerName: user.fullName,
      buyerEmail: user.primaryEmailAddress.emailAddress,
      deliveryAddress: address,
      deliveryPhone: phone,
    };

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderData),
    });

    if (res.ok) {
      const { paymentUrl } = await res.json();
      router.push(paymentUrl);
    } else {
      const err = await res.json();
      setError(err.error || "Failed to start purchase");
    }
  };

  if (loading) return <p className="text-center min-h-screen">Loading...</p>;
  if (error)
    return <p className="text-center text-red-500 min-h-screen">{error}</p>;
  if (!book) return <p className="text-center min-h-screen">Book not found</p>;

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

      {/* Purchase Button */}
      <h2 className="mt-6 text-lg font-semibold">Delivery Info</h2>

      {!useProfile && (
        <>
          <textarea
            className="w-full border p-2 mt-2 dark:bg-black"
            placeholder="Delivery Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
          />
          <input
            className="w-full border p-2 mt-2 dark:bg-black"
            placeholder="Phone Number"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </>
      )}
      <button
        onClick={handlePurchase}
        className="mt-4 bg-blue-600 text-white px-6 py-2 rounded"
      >
        Proceed to Payment
      </button>
      {error && <p className="mt-2 text-red-500">{error}</p>}
    </div>
  );
}
