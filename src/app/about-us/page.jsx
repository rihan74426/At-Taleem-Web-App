"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { FiTrash2 } from "react-icons/fi";
import { useUser } from "@clerk/nextjs";
import { format } from "date-fns";

export default function AboutUsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const user = useUser();

  // Function to generate a random hex color
  const getRandomColor = () => {
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  // Fetch reviews and assign random colors
  const fetchReview = async () => {
    try {
      const res = await fetch("/api/reviews");
      if (res.ok) {
        const data = await res.json();
        const reviewsWithColor = data.reviews.map((review) => ({
          ...review,
          color: getRandomColor(),
        }));
        setReviews(reviewsWithColor);
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

  // Delete review function (adjusted to use review._id)
  const deleteReview = async (id) => {
    if (
      user.user.id !== reviews.find((i) => i._id === id).userId &&
      !user.user.publicMetadata.isAdmin
    ) {
      Alert("You are not authorized to delete this review");
      return null;
    }
    console.log(reviews.find((i) => i._id === id).userId);
    if (confirm("Are you sure you want to delete this review?"))
      try {
        await fetch(`/api/reviews`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: user.user.id,
            reviewId: id,
          }),
        });
        setReviews((rs) => rs.filter((r) => r._id !== id));
      } catch (error) {
        console.log("Error deleting review", error);
      }
  };

  if (loading) return <p className="p-8 text-center">Loading…</p>;

  return (
    <div className="p-6 min-h-screen">
      <h1 className="text-3xl font-bold text-center mb-6">All User Reviews</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reviews.map((r) => (
          <div
            key={r._id}
            className="relative p-6 bg-amber-100 dark:bg-[#0B192C] border"
            style={{
              borderBottomRightRadius: "50%",
              minHeight: "200px", // Ensures enough space for content
            }}
          >
            {/* Text Container */}
            <div className="grid grid-cols-5 flex-wrap">
              <div className="col-span-4">
                <p className="text-2xl font-bold mb-2">{r.userName}</p>
                <p className="italic text-justify mb-4">“{r.reviewText}”</p>
              </div>
              <div className="items-end text-center ml-5">
                {r.userProfilePic ? (
                  <div>
                    <Image
                      src={r.userProfilePic}
                      width={100}
                      height={100}
                      className="rounded-full"
                      alt={r.userName}
                    />
                  </div>
                ) : (
                  <div className=" p-3 sm:p-6 border rounded-full text-center">
                    ছবি নেই
                  </div>
                )}
                <p className=" ">পেশাঃ {r.profession}</p>
                <p className="text-xs  text-gray-500">
                  {format(new Date(r.createdAt).toLocaleString(), "PP p")}
                </p>
              </div>
            </div>

            {/* Profile Picture */}

            {/* Delete Button */}
            {(user.user.publicMetadata.isAdmin ||
              user.user.id === r.userId) && (
              <button
                onClick={() => deleteReview(r._id)}
                className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                title="Delete review"
              >
                <FiTrash2 />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
