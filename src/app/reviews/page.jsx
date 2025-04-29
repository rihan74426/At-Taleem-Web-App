// src/app/admin/reviews/page.jsx
"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { FiTrash2 } from "react-icons/fi";
import { useUser } from "@clerk/nextjs";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const user = useUser();

  const fetchReview = async () => {
    try {
      const res = await fetch("/api/reviews");
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews);
      }
    } catch (error) {
      console.log("Error fetching reviews", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReview();
  }, []);

  const deleteReview = async (id) => {
    await fetch(`/api/reviews`, {
      method: "DELETE",
      body: {
        userId: user.user.id,
        reviewId: id,
      },
    });
    setReviews((rs) => rs.filter((r) => r.userId !== id));
  };

  if (loading) return <p className="p-8 text-center">Loading…</p>;

  return (
    <div className="p-6 bg-[#f6d6d6] min-h-screen">
      <h1 className="text-3xl font-bold mb-6">All User Reviews</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reviews.map((r) => (
          <div key={r._id} className="p-4 bg-white rounded-lg shadow">
            <div className="flex items-center mb-3">
              {r.userProfilePic && (
                <Image
                  src={r.userProfilePic}
                  width={48}
                  height={48}
                  className="rounded-full"
                  alt={r.userName}
                />
              )}
              <div className="ml-3">
                <p className="font-semibold">{r.userName}</p>
                <p className="text-sm text-gray-600">{r.profession}</p>
              </div>
              <button
                onClick={() => deleteReview(r.userId)}
                className="ml-auto text-red-500 hover:text-red-700"
                title="Delete review"
              >
                <FiTrash2 />
              </button>
            </div>
            <p className="text-gray-800">{r.reviewText}</p>
            <p className="text-xs text-gray-500 mt-2">
              {new Date(r.createdAt).toLocaleString()}
              {r.isEdited && " (edited)"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
