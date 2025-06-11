"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import {
  FaHeart,
  FaRegHeart,
  FaEdit,
  FaTrash,
  FaBookmark,
  FaRegBookmark,
} from "react-icons/fa";
import { AiFillEdit } from "react-icons/ai";
import { BsTrash } from "react-icons/bs";
import TimeAgo from "react-timeago";
import MasalahForm from "../../Components/MasalahForm";
import ResponseModal from "../../Components/ResponseModal";
import { MasalahDetailSkeleton } from "../../Components/MasalahSkeleton";

export default function MasalahDetailPage() {
  const { user, isLoaded } = useUser();
  const { id } = useParams();
  const router = useRouter();
  const [masalah, setMasalah] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const [users, setUsers] = useState([]);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [newComment, setNewComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [modal, setModal] = useState({
    isOpen: false,
    message: "",
    status: "",
  });
  const [isCommentSubmitting, setIsCommentSubmitting] = useState(false);
  const [isReplySubmitting, setIsReplySubmitting] = useState(false);
  const [likingCommentId, setLikingCommentId] = useState(null);
  const [isEditingComment, setIsEditingComment] = useState(false);
  const [error, setError] = useState(null);

  // Fetch masalah details and comments
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [masalahRes, commentsRes, usersRes] = await Promise.all([
        fetch(`/api/masalah/${id}`),
        fetch(`/api/comments?entityId=${id}&commentType=masalah`),
        fetch("/api/user", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }),
      ]);

      if (!masalahRes.ok) {
        throw new Error("Failed to fetch masalah details");
      }
      if (!commentsRes.ok) {
        throw new Error("Failed to fetch comments");
      }
      if (!usersRes.ok) {
        throw new Error("Failed to fetch users");
      }

      const [masalahData, commentsData, usersData] = await Promise.all([
        masalahRes.json(),
        commentsRes.json(),
        usersRes.json(),
      ]);

      setMasalah(masalahData);
      setComments(commentsData.comments);
      setUsers(usersData.users.data);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.message);
      setModal({
        isOpen: true,
        message: "ডাটা লোড করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।",
        status: "error",
      });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (isLoaded) {
      fetchData();
    }
  }, [id, isLoaded]);

  // Check if masalah is bookmarked
  useEffect(() => {
    const savedBookmarks = localStorage.getItem("bookmarkedMasalah");
    if (savedBookmarks) {
      try {
        const bookmarks = JSON.parse(savedBookmarks);
        setBookmarked(bookmarks.includes(id));
      } catch (err) {
        console.error("Error loading bookmarks:", err);
      }
    }
  }, [id]);

  // Handle like toggle
  const handleLike = async () => {
    if (!user) {
      setModal({
        isOpen: true,
        message: "মাসআলা পছন্দ করতে লগইন করুন",
        status: "error",
      });
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/masalah/${masalah._id}`, {
        method: "PATCH",
      });

      if (res.ok) {
        // Find the current item to check its like status
        const isCurrentlyLiked = masalah?.likers.includes(user.id);

        // Update the state directly based on the current state
        setMasalah((prevMasalah) => {
          const updatedLikers = isCurrentlyLiked
            ? masalah.likers.filter((id) => id !== user.id)
            : [...masalah.likers, user.id];

          return {
            ...masalah,
            likers: updatedLikers,
          };
        });

        // Show success message with the correct status
        setModal({
          isOpen: true,
          message: `মাসআলা ${
            isCurrentlyLiked ? "অপছন্দ করা হয়েছে" : "পছন্দ করা হয়েছে"
          }`,
          status: "success",
        });
      } else {
        const errorData = await res.json();
        setModal({
          isOpen: true,
          message: "মাসআলা পছন্দ করা ব্যর্থ হয়েছে",
          status: "error",
        });
      }
    } catch (err) {
      console.error("Error toggling like:", err);
      setModal({
        isOpen: true,
        message: "মাসআলা পছন্দ করা ব্যর্থ হয়েছে",
        status: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  // Handle bookmark toggle
  const handleBookmark = () => {
    if (!user) {
      setModal({
        isOpen: true,
        message: "মাসআলা বুকমার্ক করতে লগইন করুন",
        status: "error",
      });
      return;
    }

    setBookmarked((prev) => {
      const newValue = !prev;
      const savedBookmarks = localStorage.getItem("bookmarkedMasalah");
      let bookmarks = [];

      try {
        bookmarks = savedBookmarks ? JSON.parse(savedBookmarks) : [];
      } catch (err) {
        console.error("Error parsing bookmarks:", err);
      }

      if (newValue) {
        bookmarks.push(id);
      } else {
        bookmarks = bookmarks.filter((ids) => ids !== id);
      }

      localStorage.setItem("bookmarkedMasalah", JSON.stringify(bookmarks));

      setModal({
        isOpen: true,
        message: `মাসআলা ${
          newValue ? "বুকমার্ক করা হয়েছে" : "বুকমার্ক থেকে সরানো হয়েছে"
        }`,
        status: "success",
      });

      return newValue;
    });
  };

  // Handle delete
  const handleDelete = async () => {
    if (!user?.publicMetadata?.isAdmin) {
      setModal({
        isOpen: true,
        message: "আপনার মাসআলা ডিলিট করার পারমিশন নাই",
        status: "error",
      });
      return;
    }

    if (!window.confirm("Are you sure you want to delete this issue?")) return;

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/masalah/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.push("/masalah");
        setModal({
          isOpen: true,
          message: "মাসআলা ডিলিট সফল হয়েছে!",
          status: "success",
        });
      } else {
        const errorData = await res.json();
        setModal({
          isOpen: true,
          message: "মাসআলা ডিলিট ব্যর্থ হয়েছে!",
          status: "error",
        });
      }
    } catch (err) {
      setModal({
        isOpen: true,
        message: "মাসআলা ডিলিট সফল হয়েছে!",
        status: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit submit
  const handleEditSubmit = async (data) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/masalah/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        const updatedMasalah = await res.json();
        fetchData();
        setShowEditModal(false);
        setModal({
          isOpen: true,
          message: "মাসআলা আপডেট সফল হয়েছে",
          status: "success",
        });
      } else {
        const errorData = await res.json();
        setModal({
          isOpen: true,
          message: "মাসআলা আপডেট ব্যর্থ হয়েছে",
          status: "error",
        });
      }
    } catch (err) {
      setModal({
        isOpen: true,
        message: "মাসআলা আপডেট সফল হয়েছে",
        status: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Comment handlers
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!user || !newComment.trim() || isCommentSubmitting) return;

    setIsCommentSubmitting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityId: id,
          commentType: "masalah",
          userId: user.id,
          username: user.fullName,
          content: newComment.trim(),
        }),
      });

      if (res.ok) {
        setNewComment("");
        const data = await res.json();
        setComments((prev) => [...prev, data]);
        setModal({
          isOpen: true,
          message: "মন্তব্য সফলভাবে যোগ করা হয়েছে",
          status: "success",
        });
      } else {
        const errorData = await res.json();
        setModal({
          isOpen: true,
          message: "মন্তব্য যোগ করা ব্যর্থ হয়েছে",
          status: "error",
        });
      }
    } catch (err) {
      console.error("Error submitting comment:", err);
      setModal({
        isOpen: true,
        message: "মন্তব্য যোগ করতে লগইন করুন",
        status: "error",
      });
    } finally {
      setIsCommentSubmitting(false);
    }
  };

  const handleReplySubmit = async (e, parentCommentId) => {
    e.preventDefault();
    if (!user || !replyText.trim() || isReplySubmitting) return;

    setIsReplySubmitting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityId: id,
          commentType: "masalah",
          userId: user.id,
          username: user.fullName,
          content: replyText.trim(),
          parentComment: parentCommentId,
        }),
      });

      if (res.ok) {
        setReplyText("");
        setReplyingTo(null);
        const data = await res.json();
        setComments((prev) =>
          prev.map((comment) =>
            comment._id === parentCommentId
              ? { ...comment, replies: [...(comment.replies || []), data] }
              : comment
          )
        );
        setModal({
          isOpen: true,
          message: "মন্তব্য যোগ করা সফল হয়েছে",
          status: "success",
        });
      } else {
        const errorData = await res.json();
        setModal({
          isOpen: true,
          message: "মন্তব্য যোগ করা ব্যর্থ হয়েছে",
          status: "error",
        });
      }
    } catch (err) {
      console.error("Error submitting reply:", err);
      setModal({
        isOpen: true,
        message: "মন্তব্য যোগ করতে লগইন করুন",
        status: "error",
      });
    } finally {
      setIsReplySubmitting(false);
    }
  };

  const handleCommentLike = async (commentId) => {
    if (!user || likingCommentId === commentId) {
      if (!user) {
        setModal({
          isOpen: true,
          message: "মন্তব্য পছন্দ করতে লগইন করুন",
          status: "error",
        });
      }
      return;
    }

    setLikingCommentId(commentId);
    try {
      const res = await fetch("/api/comments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId, userId: user.id }),
      });

      if (res.ok) {
        const { updatedComment } = await res.json();
        setComments((prev) =>
          prev.map((comment) =>
            comment._id === commentId
              ? updatedComment
              : {
                  ...comment,
                  replies: comment.replies?.map((reply) =>
                    reply._id === commentId ? updatedComment : reply
                  ),
                }
          )
        );
      } else {
        const errorData = await res.json();
        setModal({
          isOpen: true,
          message: "মন্তব্য পছন্দ করা ব্যর্থ হয়েছে",
          status: "error",
        });
      }
    } catch (err) {
      console.error("Error liking comment:", err);
      setModal({
        isOpen: true,
        message: "মন্তব্য পছন্দ করা ব্যর্থ হয়েছে",
        status: "error",
      });
    } finally {
      setLikingCommentId(null);
    }
  };

  const handleCommentEdit = async (e, commentId) => {
    e.preventDefault();
    if (!editingText.trim() || isEditingComment) return;

    setIsEditingComment(true);
    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editingText.trim() }),
      });

      if (res.ok) {
        const updatedComment = await res.json();
        setComments((prev) =>
          prev.map((comment) =>
            comment._id === commentId
              ? updatedComment
              : {
                  ...comment,
                  replies: comment.replies?.map((reply) =>
                    reply._id === commentId ? updatedComment : reply
                  ),
                }
          )
        );
        setEditingCommentId(null);
        setEditingText("");
        setModal({
          isOpen: true,
          message: "মন্তব্য আপডেট সফল হয়েছে",
          status: "success",
        });
      } else {
        const errorData = await res.json();
        setModal({
          isOpen: true,
          message: "মন্তব্য আপডেট ব্যর্থ হয়েছে",
          status: "error",
        });
      }
    } catch (err) {
      console.error("Error editing comment:", err);
      setModal({
        isOpen: true,
        message: "মন্তব্য আপডেট ব্যর্থ হয়েছে",
        status: "error",
      });
    } finally {
      setIsEditingComment(false);
    }
  };

  const handleCommentDelete = async (commentId) => {
    if (!window.confirm("Are you sure you want to delete this comment?"))
      return;

    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setComments((prev) =>
          prev.filter((comment) => {
            if (comment._id === commentId) return false;
            if (comment.replies) {
              comment.replies = comment.replies.filter(
                (reply) => reply._id !== commentId
              );
            }
            return true;
          })
        );
        setModal({
          isOpen: true,
          message: "মন্তব্য ডিলিট সফল হয়েছে",
          status: "success",
        });
      } else {
        const errorData = await res.json();
        setModal({
          isOpen: true,
          message: "মন্তব্য ডিলিট ব্যর্থ হয়েছে",
          status: "error",
        });
      }
    } catch (err) {
      console.error("Error deleting comment:", err);
      setModal({
        isOpen: true,
        message: "মন্তব্য ডিলিট ব্যর্থ হয়েছে",
        status: "error",
      });
    }
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 dark:text-red-400">
            মাসআলা লোড করতে সমস্যা হয়েছে
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">{error}</p>
          <button
            onClick={() => router.push("/masalah")}
            className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition"
          >
            মাসআলার তালিকায় ফিরে যান
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return <MasalahDetailSkeleton />;
  }

  if (!masalah) {
    return (
      <div className="container mx-auto px-4 py-8 min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            মাসআলা পাওয়া যায়নি
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            আপনি যে মাসআলাটি খুঁজছেন তা পাওয়া যায়নি বা মুছে ফেলা হয়েছে।
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Issue Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              {masalah.title}
            </h1>
            <div className="flex flex-wrap gap-2 mb-4">
              {masalah.categories.map((cat) => (
                <span
                  key={cat._id}
                  className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium"
                >
                  {cat.name}
                </span>
              ))}
            </div>
          </div>
          <div className="flex gap-4">
            <button
              onClick={handleLike}
              className="flex items-center gap-2 text-gray-500 hover:text-red-500 transition-colors disabled:opacity-50"
              disabled={!user || isSubmitting}
              title={!user ? "Sign in to like" : ""}
            >
              {masalah.likers.includes(user?.id) ? (
                <FaHeart className="text-red-500" />
              ) : (
                <FaRegHeart />
              )}
              <span>{masalah.likers.length}</span>
            </button>
            <button
              onClick={handleBookmark}
              className="text-gray-500 hover:text-yellow-500 transition-colors disabled:opacity-50"
              disabled={!user}
              title={!user ? "Sign in to bookmark" : ""}
            >
              {bookmarked ? (
                <FaBookmark className="text-yellow-500" />
              ) : (
                <FaRegBookmark />
              )}
            </button>
            {user?.publicMetadata?.isAdmin && (
              <div className="flex gap-2">
                <button
                  onClick={() => setShowEditModal(true)}
                  className="text-gray-500 hover:text-blue-500 transition-colors"
                  title="Edit"
                  disabled={isSubmitting}
                >
                  <FaEdit />
                </button>
                <button
                  onClick={handleDelete}
                  className="text-gray-500 hover:text-red-500 transition-colors"
                  title="Delete"
                  disabled={isSubmitting}
                >
                  <FaTrash />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="prose dark:prose-invert max-w-none mt-6">
          <h2 className="text-xl font-semibold mb-4">বিবরণ</h2>
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {masalah.description}
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4">তথ্যসূত্র</h2>
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {masalah.references}
          </p>
        </div>

        <div className="mt-6 text-sm text-gray-500 dark:text-gray-400">
          <p>
            তৈরি করা হয়েছে: {new Date(masalah.createdAt).toLocaleDateString()}
          </p>
          {masalah.updatedAt !== masalah.createdAt && (
            <p>
              আপডেট করা হয়েছে:{" "}
              {new Date(masalah.updatedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      {/* Comments Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          মন্তব্য
        </h2>

        {/* Comment Form */}
        {user ? (
          <div className="mb-6">
            <textarea
              className="w-full border rounded p-3 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="মন্তব্য লিখুন..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows="3"
              required
              disabled={isCommentSubmitting}
            />
            <button
              onClick={handleCommentSubmit}
              className="mt-2 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition disabled:opacity-50"
              disabled={isCommentSubmitting}
            >
              {isCommentSubmitting ? "জমা হচ্ছে..." : "জমা দিন"}
            </button>
          </div>
        ) : (
          <p className="text-gray-500 text-center mb-6">
            মন্তব্য করতে লগইন করুন
          </p>
        )}

        {/* Comments List */}
        <div className="space-y-6">
          {comments.map((comment) => (
            <div key={comment._id} className="border-b pb-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  {comment.username}
                </span>
                <span className="text-xs text-gray-500">
                  <TimeAgo date={comment.createdAt} />
                </span>
              </div>

              {editingCommentId === comment._id ? (
                <div className="mt-2">
                  <textarea
                    className="w-full border rounded p-3 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    rows="2"
                    required
                    disabled={isEditingComment}
                  />
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={(e) => handleCommentEdit(e, comment._id)}
                      className="bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700 transition disabled:opacity-50"
                      disabled={isEditingComment}
                    >
                      {isEditingComment ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={() => {
                        setEditingCommentId(null);
                        setEditingText("");
                      }}
                      className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600 transition"
                      disabled={isEditingComment}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-700 dark:text-gray-300">
                  {comment.content}
                </p>
              )}

              <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
                <button
                  onClick={() => handleCommentLike(comment._id)}
                  className="flex items-center text-indigo-400 hover:text-indigo-600 transition disabled:opacity-50"
                  disabled={likingCommentId === comment._id}
                >
                  ❤️ {comment.likes.length || 0}
                </button>

                <button
                  onClick={() =>
                    user
                      ? setReplyingTo(comment._id)
                      : setModal({
                          isOpen: true,
                          message: "মন্তব্য করতে লগইন করুন",
                          status: "error",
                        })
                  }
                  className="text-green-400 hover:text-green-600 transition"
                >
                  Reply
                </button>

                {user?.id === comment.userId && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingCommentId(comment._id);
                        setEditingText(comment.content);
                      }}
                      className="text-blue-500 hover:text-blue-700 transition"
                    >
                      <AiFillEdit className="inline mr-1" /> Edit
                    </button>
                    <button
                      onClick={() => handleCommentDelete(comment._id)}
                      className="text-red-500 hover:text-red-700 transition"
                    >
                      <BsTrash className="inline mr-1" /> Delete
                    </button>
                  </div>
                )}
              </div>

              {replyingTo === comment._id && (
                <div className="mt-4 ml-8 border-l-2 pl-4">
                  <textarea
                    className="w-full border rounded p-3 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="মন্তব্য লিখুন..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows="2"
                    required
                    disabled={isReplySubmitting}
                  />
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={(e) => handleReplySubmit(e, comment._id)}
                      className="bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700 transition disabled:opacity-50"
                      disabled={isReplySubmitting}
                    >
                      {isReplySubmitting ? "জমা হচ্ছে..." : "জমা দিন"}
                    </button>
                    <button
                      onClick={() => setReplyingTo(null)}
                      className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600 transition"
                      disabled={isReplySubmitting}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {comment.replies && (
                <div className="mt-4 space-y-4">
                  {comment.replies.map((reply) => (
                    <div key={reply._id} className="ml-8 border-l-2 pl-4">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-semibold text-gray-700 dark:text-gray-300">
                          {reply.username}
                        </span>
                        <span className="text-xs text-gray-500">
                          <TimeAgo date={reply.createdAt} />
                        </span>
                      </div>

                      {editingCommentId === reply._id ? (
                        <div className="mt-2">
                          <textarea
                            className="w-full border rounded p-3 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            rows="2"
                            required
                          />
                          <div className="mt-2 flex gap-2">
                            <button
                              onClick={(e) => handleCommentEdit(e, reply._id)}
                              className="bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700 transition"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingCommentId(null)}
                              className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600 transition"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-700 dark:text-gray-300">
                          {reply.content}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
                        <button
                          onClick={() => handleCommentLike(reply._id)}
                          className="flex items-center text-indigo-400 hover:text-indigo-600 transition disabled:opacity-50"
                          disabled={likingCommentId === reply._id}
                        >
                          ❤️ {reply.likes.length || 0}
                        </button>

                        {user?.id === reply.userId && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setEditingCommentId(reply._id);
                                setEditingText(reply.content);
                              }}
                              className="text-blue-500 hover:text-blue-700 transition"
                            >
                              <AiFillEdit className="inline mr-1" /> Edit
                            </button>
                            <button
                              onClick={() => handleCommentDelete(reply._id)}
                              className="text-red-500 hover:text-red-700 transition"
                            >
                              <BsTrash className="inline mr-1" /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Edit Issue</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                disabled={isSubmitting}
              >
                ×
              </button>
            </div>
            <MasalahForm
              initialData={masalah}
              onSubmit={handleEditSubmit}
              isAdmin={user?.publicMetadata?.isAdmin}
              isSubmitting={isSubmitting}
              onClose={() => setShowEditModal(false)}
            />
          </div>
        </div>
      )}

      {/* Response Modal */}
      <ResponseModal
        isOpen={modal.isOpen}
        message={modal.message}
        status={modal.status}
        onClose={() => setModal((m) => ({ ...m, isOpen: false }))}
      />
    </div>
  );
}
