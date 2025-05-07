"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { FiTrash2 } from "react-icons/fi";
import { useUser } from "@clerk/nextjs";
import Loader from "../Components/Loader";
import ResponseModal from "../Components/ResponseModal";
import { useRouter } from "next/navigation";
import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";
import { motion, useAnimation } from "framer-motion";

// Review Component
export function ReviewCard({
  review,
  user,
  toggleLove,
  deleteReview,
  toggleStatus,
}) {
  const loved = review.likes?.includes(user.user?.id);
  const animation = useAnimation();

  return (
    <div
      key={review._id}
      className="relative bg-amber-100 dark:bg-[#0B192C] border rounded-lg overflow-hidden"
      style={{ borderBottomRightRadius: "50%", minHeight: 200 }}
    >
      {/* Love animation */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
        initial={{ opacity: 0, scale: 0 }}
        animate={animation}
      >
        <AiFillHeart className="text-red-500 text-5xl" />
      </motion.div>

      {/* Responsive grid: 1 col on sm, 5 cols on md+ */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4">
        {/* Main content spans all on sm, first 4 cols on md */}
        <div className="col-span-1 md:col-span-4 space-y-3">
          <div className="sm:flex sm:justify-between sm:items-center sm:space-x-2">
            <h3 className="text-2xl m-2 font-bold">{review.userName}</h3>
            <span className="text-sm m-2 text-gray-700 dark:text-gray-300">
              (পেশাঃ {review.profession})
            </span>
            <span
              className={`mt-2 sm:mt-0 m-2 px-2 text-sm rounded ${
                review.status === "approved"
                  ? "bg-green-200 text-green-800"
                  : "bg-yellow-200 text-yellow-800"
              }`}
            >
              {review.status.charAt(0).toUpperCase() + review.status.slice(1)}
            </span>
            {review.status === "approved" && (
              <motion.button
                onClick={() => toggleLove(review)}
                whileTap={{ scale: 0.8 }}
                whileHover={{ scale: 1.5 }}
                className=" flex items-center space-x-1 ml-auto mt-2 sm:mt-0"
                aria-label={loved ? "Unlove" : "Love"}
              >
                {loved ? (
                  <AiFillHeart className="text-red-500" size={30} />
                ) : (
                  <AiOutlineHeart className="text-gray-500" size={30} />
                )}
                <span className="">{review.likes.length}</span>
              </motion.button>
            )}
          </div>
          <p className="italic text-justify whitespace-pre-wrap">
            “{review.reviewText}”
          </p>
        </div>

        {/* Sidebar spans full width on sm, 1 col on md */}
        <div className="col-span-1 flex flex-col items-center sm:mt-20 space-y-3">
          {review.userProfilePic ? (
            <Image
              src={review.userProfilePic}
              width={100}
              height={100}
              className="rounded-full"
              alt={review.userName}
            />
          ) : (
            <div className="w-24 h-24 border rounded-full flex items-center justify-center">
              ছবি নেই
            </div>
          )}

          <p className="text-xs text-gray-500">
            Date: {new Date(review.createdAt).toLocaleDateString()}
          </p>

          {review.status === "pending" && (
            <div className="flex space-x-2">
              <button
                onClick={() => toggleStatus(review, "approved")}
                className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded"
              >
                Approve
              </button>
              <button
                onClick={() => toggleStatus(review, "rejected")}
                className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded"
              >
                Reject
              </button>
            </div>
          )}

          {review.status === "rejected" && (
            <button
              onClick={() => toggleStatus(review, "approved")}
              className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded"
            >
              Approve
            </button>
          )}
        </div>
      </div>

      {/* Delete */}
      {(user.user?.publicMetadata?.isAdmin ||
        user.user?.id === review.userId) && (
        <button
          onClick={() => deleteReview(review._id)}
          className="absolute top-2 right-2 text-red-500 hover:text-red-700"
          title="Delete review"
        >
          <FiTrash2 />
        </button>
      )}
    </div>
  );
}

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
  useEffect(() => {
    fetchReview();
  }, []);

  const submitReview = () => {
    if (!user.isSignedIn) {
      return showModal("মন্তব্য প্রদানের জন্য দয়া করে আগে লগিন করুন", "error");
    }
    router.push(`/dashboard?tab=review`);
  };

  const animation = useAnimation();
  const toggleLove = async (review) => {
    if (!user.isSignedIn) {
      return showModal("পছন্দ করার জন্য আপনাকে লগিন করতে হবে!", "error");
    }
    // Optimistically update UI
    const updated = reviews.map((r) =>
      r._id === review._id
        ? {
            ...r,
            likes: r.likes?.includes(user.user.id)
              ? r.likes.filter((id) => id !== user.user.id)
              : [...(r.likes || []), user.user.id],
          }
        : r
    );
    setReviews(updated);

    // Call backend
    const res = await fetch(`/api/reviews`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.user.id, reviewId: review._id }),
    });

    if (res.ok) {
      const { message } = await res.json();
      await animation.start({
        opacity: 1,
        scale: 1,
        transition: { duration: 0.5, ease: "easeOut" },
      });
      await animation.start({
        opacity: 0,
        scale: 10,
        transition: { duration: 0.5, ease: "easeIn" },
      });
      showModal(
        `আপনি মন্তব্যটি ${
          message === "Liked" ? "পছন্দ করেছেন" : "থেকে পছন্দ তুলেছেন"
        }!`,
        "success"
      );
    } else {
      showModal(
        "কিছু একটা সমস্যা হয়েছে! দয়া করে একটু পর আবার চেষ্টা করুন!",
        "error"
      );
    }
  };

  const toggleStatus = async (review, status) => {
    if (!user.user?.publicMetadata.isAdmin) {
      showModal("You are not authorized to perform this action", "error");
      return;
    }
    try {
      const res = await fetch(`/api/reviews`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...review,
          reviewId: review._id,
          status: status,
        }),
      });
      if (res.ok) {
        fetchReview();
        const { review: updatedReview } = await res.json();
        showModal(
          `মন্তব্যটি যথাযথভাবে ${
            updatedReview.status === "rejected" ? "রিজেক্ট" : "এপ্রুভ"
          } করা হয়েছে!`,
          "success"
        );
      }
    } catch (error) {
      console.log("Error Updating review", error);
    }
  };

  const deleteReview = async (id) => {
    if (
      user.user?.id !== reviews.find((i) => i._id === id).userId &&
      !user.user?.publicMetadata?.isAdmin
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

  const isAdmin = user.user?.publicMetadata.isAdmin;
  const visibleReviews = isAdmin
    ? [...reviews].sort((a, b) => {
        if (a.status === "pending" && b.status !== "pending") return -1;
        if (a.status !== "pending" && b.status === "pending") return 1;
        return 0;
      })
    : reviews.filter((r) => r.status === "approved");

  return (
    <div className="p-6 min-h-screen overflow-hidden">
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
        <div className="flex justify-center">
          <Loader />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {visibleReviews.map((r) => (
            <ReviewCard
              key={r._id}
              review={r}
              user={user}
              toggleLove={toggleLove}
              deleteReview={deleteReview}
              toggleStatus={toggleStatus}
            />
          ))}
        </div>
      )}

      <ResponseModal
        isOpen={modal.isOpen}
        message={modal.message}
        status={modal.status}
        onClose={() => setModal((m) => ({ ...m, isOpen: false }))}
      />
    </div>
  );
}
