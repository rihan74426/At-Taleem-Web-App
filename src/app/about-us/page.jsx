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
function Review({ review, user, toggleLove, deleteReview, toggleStatus }) {
  const animation = useAnimation();
  const loved = review.likes?.includes(user.user.id);

  return (
    <div
      key={review._id}
      className="relative p-6 bg-amber-100 dark:bg-[#0B192C] border"
      style={{
        borderBottomRightRadius: "50%",
        minHeight: "200px", // Ensures enough space for content
      }}
    >
      {/* Animation overlay */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
        initial={{ opacity: 0, scale: 0 }}
        animate={animation}
      >
        <AiFillHeart className="text-red-500" style={{ fontSize: "50px" }} />
      </motion.div>

      {/* Content */}
      <div className="grid grid-cols-5 flex-wrap">
        <div className="col-span-4">
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold mb-2">{review.userName} - </p>
            <span className="text-sm" style={{ fontWeight: "normal" }}>
              পেশাঃ {review.profession}
            </span>
            <span
              className={`p-1 text-sm m-2 rounded ${
                review.status === "approved"
                  ? "bg-green-200 text-green-800"
                  : "bg-yellow-200 text-yellow-800"
              }`}
            >
              {review.status.charAt(0).toUpperCase() + review.status.slice(1)}
            </span>
            <div className="flex space-x-2">
              {/* Love button */}
              <motion.button
                onClick={async () => {
                  toggleLove(review);
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
                }}
                whileTap={{ scale: 0.8 }}
                whileHover={{ scale: 2 }}
                className="text-xl focus:outline-none"
                aria-label={loved ? "পছন্দ তুলে নিন" : "পছন্দ করুন"}
              >
                {loved ? (
                  <AiFillHeart size={20} className="text-red-500" />
                ) : (
                  <AiOutlineHeart size={20} className="text-gray-500" />
                )}
              </motion.button>
              <span>{review.likes.length}</span>
            </div>
          </div>
          <p className="italic text-justify mb-4 whitespace-pre-wrap">
            “{review.reviewText}”
          </p>
        </div>
        <div className="items-end text-center ml-5">
          {review.userProfilePic ? (
            <div>
              <Image
                src={review.userProfilePic}
                width={100}
                height={100}
                className="rounded-full"
                alt={review.userName}
              />
            </div>
          ) : (
            <div className="p-3 sm:p-6 border rounded-full text-center">
              ছবি নেই
            </div>
          )}
          <p className="text-xs mt-10 text-gray-500">
            Date: {new Date(review.createdAt).toLocaleDateString()}
          </p>
          <button
            onClick={() => toggleStatus(review)}
            className={`p-1 text-white rounded my-2 ${
              review.status === "approved"
                ? "bg-red-500 hover:bg-red-600"
                : "bg-green-500 hover:bg-green-600"
            }`}
          >
            {review.status === "approved" ? "Reject" : "Approve"}
          </button>
        </div>
      </div>

      {/* Delete Button */}
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

  const submitReview = () => {
    if (!user.isSignedIn) {
      return showModal("মন্তব্য প্রদানের জন্য দয়া করে আগে লগিন করুন", "error");
    }
    router.push(`/dashboard?tab=review`);
  };

  useEffect(() => {
    fetchReview();
  }, []);

  const toggleLove = async (review) => {
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

  const toggleStatus = async (review) => {
    if (!user.user.publicMetadata.isAdmin) {
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
          status: review.status === "approved" ? "rejected" : "approved",
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
        <div className="flex place-content-center">
          <Loader />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reviews.map((r) => (
            <Review
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
        onClose={() => setModal({ ...modal, isOpen: false })}
      />
    </div>
  );
}
