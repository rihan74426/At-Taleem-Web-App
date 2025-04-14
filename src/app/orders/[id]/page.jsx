// src/app/orders/[id]/page.jsx
"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function OrderDetailsPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    fetch(`/api/orders/${id}`)
      .then((res) => res.json())
      .then((data) => setOrder(data.order))
      .catch(console.error);
  }, [id]);

  if (!order) return <p>Loading...</p>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Order #{order._id}</h1>
      <p>Status: {order.paymentStatus}</p>
      <p>Amount: {order.amount} BDT</p>
      <p>Delivery Address: {order.deliveryAddress}</p>
      <p>Delivery Phone: {order.deliveryPhone}</p>
      <h2 className="mt-4 font-semibold">Books:</h2>
      <ul className="list-disc pl-5">
        {order.bookIds.map((bid) => (
          <li key={bid}>{bid}</li> // ideally fetch book details
        ))}
      </ul>
    </div>
  );
}
