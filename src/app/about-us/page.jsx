"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { FiTrash2 } from "react-icons/fi";
import { useUser } from "@clerk/nextjs";
import { format } from "date-fns";
import Link from "next/link";
import Loader from "../Components/Loader";
import ResponseModal from "../Components/ResponseModal";
import { useRouter } from "next/navigation";

export default function AboutUsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({
    isOpen: false,
    message: "",
    status: "",
  });
  const showModal = (message, status) =>
    setModal({ isOpen: true, message, status });

  const user = useUser();
  const router = useRouter();

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
  const submitReview = () => {
    if (!user.isSignedIn) {
      return showModal("মন্তব্য প্রদানের জন্য দয়া করে আগে লগিন করুন", "error");
    }
    router.push(`/dashboard?tab=review`);
  };

  useEffect(() => {
    fetchReview();
  }, []);

  const toggleStatus = async (review) => {
    if (!user.user.publicMetadata.isAdmin) {
      showModal("You are not authorized to perform this action", "error");
    }
    try {
      const res = await fetch(`/api/reviews`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...review,
          status: review.status === "pending" ? "approved" : "rejected",
        }),
      });
      if (res.ok) {
        const { review } = await res.json();
        showModal(
          `মন্তব্যটি যথাযথভাবে ${
            review.status === "rejected" ? "রিজেক্ট" : "এপ্রুভ"
          } করা হয়েছে!`,
          "success"
        );
      }
    } catch (error) {
      console.log("Error deleting review", error);
    }
  };

  // Delete review function (adjusted to use review._id)
  const deleteReview = async (id) => {
    if (
      user.user?.id !== reviews.find((i) => i._id === id).userId &&
      !user?.user.publicMetadata?.isAdmin
    ) {
      showModal("You are not authorized to delete this review", "error");
      return null;
    }
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

  return (
    <div className="p-6 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 m-10">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          তালিমের সদস্যদের মন্তব্য
        </h1>
        <button
          onClick={submitReview}
          className="self-start md:self-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          আপনার মন্তব্য জানান
        </button>
      </div>
      {loading ? (
        <div className="flex place-content-center">
          <Loader />
        </div>
      ) : (
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
                  <p className="text-2xl font-bold mb-2">
                    {r.userName} -{" "}
                    <span className="text-sm" style={{ fontWeight: "normal" }}>
                      পেশাঃ {r.profession}
                    </span>
                    <span
                      className={`p-1 text-sm m-2 rounded ${
                        r.status === "approved"
                          ? "bg-green-200 text-green-800"
                          : "bg-yellow-200 text-yellow-800"
                      }`}
                    >
                      {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                    </span>
                  </p>
                  <p className="italic text-justify mb-4 whitespace-pre-wrap">
                    “{r.reviewText}”
                  </p>
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
                  <p className="text-xs mt-10 text-gray-500">
                    Date: {new Date(r.createdAt).toLocaleDateString()}
                  </p>
                  <button
                    onClick={toggleStatus}
                    className={`p-1  text-white rounded  ${
                      r.status === "pending"
                        ? "bg-green-500 hover:bg-green-600"
                        : "bg-yellow-500 hover:bg-yellow-600"
                    }`}
                  >
                    {r.status === "pending" ? "Approve" : "Hold"}
                  </button>
                </div>
              </div>

              {/* Profile Picture */}

              {/* Delete Button */}
              {(user.user?.publicMetadata?.isAdmin ||
                user.user?.id === r.userId) && (
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
      )}
      <ResponseModal
        isOpen={modal.isOpen}
        message={modal.message}
        status={modal.status}
        onClose={() => setModal({ ...modal, isOpen: false })}
      />
    </div>
  );
}
