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
import { UserButton } from "@clerk/nextjs";

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
  const [users, setUsers] = useState([]);
  const [imageError, setImageError] = useState(false);
  const [showLikers, setShowLikers] = useState(false);
  const { user: clerkUser } = useUser();

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/user", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        next: { revalidate: 3600 },
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users.data);
      }
    } catch (error) {
      console.log(error.message);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [review]);

  const getUserName = (id) => {
    const u = users.find((u) => u.id === id);
    return u ? `${u.firstName} ${u.lastName}` : "Unknown";
  };

  const names = review.likes.map(getUserName).filter(Boolean);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative bg-white dark:bg-gray-800 rounded-[2rem] shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
      style={{
        clipPath: "polygon(0 0, 100% 0, 100% 85%, 85% 100%, 0 100%)",
      }}
    >
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 dark:bg-teal-500/20 rounded-bl-full" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-500/10 dark:bg-amber-500/20 rounded-tr-full" />

      <div className="p-6 relative">
        {/* Header Section */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-4">
            {review.userProfilePic && !imageError ? (
              <div className="relative w-16 h-16">
                <Image
                  src={review.userProfilePic}
                  alt={review.userName}
                  fill
                  sizes="64px"
                  className="rounded-full object-cover border-2 border-teal-500"
                  onError={() => setImageError(true)}
                  priority={false}
                  loading="lazy"
                  quality={75}
                />
              </div>
            ) : (
              <div className="relative w-16 h-16 dark:bg-gray-800">
                <Image
                  src="/default-user.png"
                  alt={review.userName}
                  fill
                  sizes="64px"
                  className="rounded-full object-cover border-2 border-teal-500"
                  onError={() => setImageError(true)}
                  priority={false}
                  loading="lazy"
                  quality={75}
                />{" "}
              </div>
            )}
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {review.userName}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                পেশাঃ {review.profession}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span
              className={`px-3 py-1 text-sm rounded-full ${
                review.status === "approved"
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
              }`}
            >
              {review.status.charAt(0).toUpperCase() + review.status.slice(1)}
            </span>
            {(user.user?.publicMetadata?.isAdmin ||
              user.user?.id === review.userId) && (
              <button
                onClick={() => deleteReview(review._id)}
                className="text-gray-400 hover:text-red-500 transition-colors"
                title="Delete review"
              >
                <FiTrash2 size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Review Content */}
        <div className="relative bg-gradient-to-br from-amber-50 to-amber-100 dark:from-gray-700 dark:to-gray-800 rounded-2xl p-6 mb-4">
          <div className="absolute -top-3 left-6 text-4xl text-amber-200 dark:text-gray-600">
            "
          </div>
          <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed relative z-10">
            {review.reviewText}
          </p>
          <div className="absolute -bottom-3 right-6 text-4xl text-amber-200 dark:text-gray-600">
            "
          </div>
        </div>

        {/* Footer Section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {new Date(review.createdAt).toLocaleDateString("bn-BD", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
            {review.status === "approved" && (
              <div className="relative">
                <motion.button
                  onClick={() => toggleLove(review)}
                  whileTap={{ scale: 0.9 }}
                  className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                  onMouseEnter={() => setShowLikers(true)}
                  onMouseLeave={() => setShowLikers(false)}
                >
                  {loved ? (
                    <AiFillHeart className="text-red-500" size={24} />
                  ) : (
                    <AiOutlineHeart size={24} />
                  )}
                  <span className="font-medium">{review.likes.length}</span>
                </motion.button>

                {/* Likers Tooltip */}
                {showLikers && names.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg whitespace-nowrap z-20"
                  >
                    <div className="relative">
                      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-8 border-transparent border-t-gray-900"></div>
                      <p className="font-medium mb-1">পছন্দ করেছেন:</p>
                      <div className="max-h-32 overflow-y-auto">
                        {names.map((name, index) => (
                          <p key={index} className="text-gray-300">
                            {name}
                          </p>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </div>

          {/* Admin Actions */}
          {review.status === "pending" && (
            <div className="flex space-x-2">
              <button
                onClick={() => toggleStatus(review, "approved")}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
              >
                Approve
              </button>
              <button
                onClick={() => toggleStatus(review, "rejected")}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                Reject
              </button>
            </div>
          )}

          {review.status === "rejected" && (
            <button
              onClick={() => toggleStatus(review, "approved")}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
            >
              Approve
            </button>
          )}
        </div>
      </div>
    </motion.div>
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
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const showModal = (message, status) =>
    setModal({ isOpen: true, message, status });

  const user = useUser();
  const router = useRouter();

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch reviews with pagination and search
  const fetchReview = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/reviews?page=${pagination.page}&limit=${pagination.limit}&search=${debouncedSearch}`
      );
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.log("Error fetching reviews", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReview();
  }, [pagination.page, pagination.limit, debouncedSearch]);

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setPagination((prev) => ({ ...prev, page: 1 })); // Reset to first page on search
  };

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
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Search reviews..."
            value={searchQuery}
            onChange={handleSearch}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={submitReview}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            আপনার মন্তব্য জানান
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center">
          <Loader />
        </div>
      ) : (
        <>
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

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center mt-8 gap-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-4 py-2">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
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
