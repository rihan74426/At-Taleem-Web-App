"use client";
import { useEffect, useState, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import QuestionForm from "../Components/QuestionForm";
import QuestionCard from "../Components/QuestionCard";
import ResponseModal from "../Components/ResponseModal";
import { QuestionCardSkeleton } from "../Components/Skeleton";
import { useQuestions } from "../hooks/useQuestions";
import AskQuestionForm from "../Components/AskQuestions";

export default function QuestionnairePage() {
  const { user, isSignedIn } = useUser();
  const {
    loading,
    error,
    questions,
    totalPages,
    currentPage,
    fetchQuestions,
    submitQuestion,
    updateQuestion,
    deleteQuestion,
    setCurrentPage,
  } = useQuestions();

  // State Management
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [resModal, setResModal] = useState({
    isOpen: false,
    message: "",
    status: "",
  });
  const [actionLoading, setActionLoading] = useState({
    helpful: null,
    bookmark: null,
  });

  const showResModal = useCallback((message, status) => {
    setResModal({ isOpen: true, message, status });
  }, []);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories);
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
      showResModal("Failed to load categories", "error");
    }
  }, [showResModal]);

  // Refetch when filters or page changes
  useEffect(() => {
    fetchQuestions({
      page: currentPage,
      search: searchTerm,
      status: statusFilter,
      category: selectedCategory,
      sort: sortBy,
    });
    fetchCategories();
  }, [
    currentPage,
    searchTerm,
    statusFilter,
    selectedCategory,
    sortBy,
    fetchQuestions,
    fetchCategories,
  ]);

  // Handle question submission
  const handleQuestionSubmit = async (questionData) => {
    try {
      if (editingQuestion) {
        await updateQuestion(editingQuestion._id, questionData);
        showResModal("Question updated successfully", "success");
      } else {
        await submitQuestion(questionData);
        showResModal("Question submitted successfully", "success");
      }
      setShowModal(false);
      setEditingQuestion(null);
    } catch (err) {
      showResModal(err.message || "Failed to submit question", "error");
    }
  };

  // Handle question deletion
  const handleDeleteQuestion = async (question) => {
    if (!confirm("Are you sure you want to delete this question?")) return;

    if (!user?.publicMetadata?.isAdmin && user?.id !== question.userId) {
      showResModal(
        "You must be an admin or the question author to delete this question",
        "error"
      );
      return;
    }

    try {
      await deleteQuestion(question._id);
      showResModal("Question deleted successfully", "success");
    } catch (err) {
      showResModal(err.message || "Failed to delete question", "error");
    }
  };

  // Handle helpful vote
  const handleHelpful = async (questionId) => {
    if (!isSignedIn) {
      showResModal("Please sign in to vote", "error");
      return;
    }

    if (actionLoading.helpful === questionId) return;
    setActionLoading((prev) => ({ ...prev, helpful: questionId }));

    try {
      const res = await fetch(`/api/questions/${questionId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          action: "helpful",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update vote");
      }

      const data = await res.json();

      // Update the question in the local state
      const updatedQuestions = questions.map((q) =>
        q._id === questionId
          ? {
              ...q,
              helpfulCount: data.helpfulVotes.length,
              helpfulVotes: data.helpfulVotes,
            }
          : q
      );

      // Update the questions state without refetching
      fetchQuestions(
        {
          page: currentPage,
          search: searchTerm,
          status: statusFilter,
          category: selectedCategory,
          sort: sortBy,
        },
        updatedQuestions
      );

      showResModal(
        data.helpfulVotes.includes(user.id)
          ? "Vote added successfully"
          : "Vote removed successfully",
        "success"
      );
    } catch (err) {
      showResModal(err.message || "Failed to update vote", "error");
    } finally {
      setActionLoading((prev) => ({ ...prev, helpful: null }));
    }
  };

  // Handle bookmark
  const handleBookmark = async (questionId) => {
    if (!isSignedIn) {
      showResModal("Please sign in to bookmark", "error");
      return;
    }

    if (actionLoading.bookmark === questionId) return;
    setActionLoading((prev) => ({ ...prev, bookmark: questionId }));

    try {
      const res = await fetch(`/api/questions/${questionId}/bookmark`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: user.id }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update bookmark");
      }

      const data = await res.json();

      // Update the question in the local state
      const updatedQuestions = questions.map((q) =>
        q._id === questionId
          ? {
              ...q,
              bookmarkCount: data.bookmarks.length,
              bookmarks: data.bookmarks || [],
            }
          : q
      );

      // Update the questions state without refetching
      fetchQuestions(
        {
          page: currentPage,
          search: searchTerm,
          status: statusFilter,
          category: selectedCategory,
          sort: sortBy,
        },
        updatedQuestions
      );

      showResModal(
        data.bookmarks.includes(user.id)
          ? "Question bookmarked successfully"
          : "Bookmark removed successfully",
        "success"
      );
    } catch (err) {
      showResModal(err.message || "Failed to update bookmark", "error");
    } finally {
      setActionLoading((prev) => ({ ...prev, bookmark: null }));
    }
  };

  // Debounced search handler
  const debouncedSearch = useCallback(
    (value) => {
      setSearchTerm(value);
      setCurrentPage(1);
    },
    [setCurrentPage]
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            প্রশ্নোত্তরসমূহ
          </h1>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setEditingQuestion(null);
              setShowModal(true);
            }}
            className="self-start md:self-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            প্রশ্ন করুন
          </motion.button>
        </div>

        {/* Search & Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="প্রশ্ন খুঁজুন..."
            value={searchTerm}
            onChange={(e) => debouncedSearch(e.target.value)}
            className="border p-2 rounded-lg w-full bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="border p-2 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">সকল প্রকার</option>
            <option value="pending">উত্তর হয়নি</option>
            <option value="answered">উত্তর হয়েছে</option>
          </select>
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="border p-2 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">সকল ক্যাটেগরি</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setCurrentPage(1);
            }}
            className="border p-2 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="newest">নতুনতম</option>
            <option value="oldest">পুরনোতম</option>
            <option value="most_helpful">সর্বাধিক উপকারী</option>
            <option value="most_bookmarked">সর্বাধিক বুকমার্ক</option>
          </select>
        </div>

        {/* Question List */}
        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <QuestionCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="text-center text-red-500">{error}</div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {questions.map((question) => (
                <QuestionCard
                  key={question._id}
                  question={question}
                  categories={categories}
                  isSignedIn={isSignedIn}
                  user={user}
                  onEdit={() => {
                    setEditingQuestion(question);
                    setShowModal(true);
                  }}
                  onDelete={() => handleDeleteQuestion(question)}
                  onBookmark={handleBookmark}
                  onHelpful={handleHelpful}
                  isLoading={{
                    helpful: actionLoading.helpful === question._id,
                    bookmark: actionLoading.bookmark === question._id,
                  }}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            {Array.from({ length: totalPages }, (_, i) => (
              <motion.button
                key={i}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-4 py-2 rounded-lg ${
                  currentPage === i + 1
                    ? "bg-blue-600 text-white"
                    : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                {i + 1}
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* Question Form Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowModal(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative bg-white dark:bg-gray-900 rounded-xl shadow-lg w-full max-w-2xl p-6 mx-4"
          >
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
            >
              ✕
            </button>
            <AskQuestionForm
              initialQuestion={editingQuestion}
              onQuestionSubmitted={handleQuestionSubmit}
            />
          </motion.div>
        </div>
      )}

      {/* Response Modal */}
      <ResponseModal
        isOpen={resModal.isOpen}
        message={resModal.message}
        status={resModal.status}
        onClose={() => setResModal({ ...resModal, isOpen: false })}
      />
    </div>
  );
}
