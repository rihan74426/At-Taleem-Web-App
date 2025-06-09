"use client";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { HiOutlinePencil, HiOutlineTrash } from "react-icons/hi";
import { BsHandThumbsUp, BsHandThumbsUpFill } from "react-icons/bs";
import { FaBookmark, FaRegBookmark } from "react-icons/fa";
import { FiShare2 } from "react-icons/fi";
import { formatDistanceToNow } from "date-fns";
import { bn } from "date-fns/locale";
import AskQuestionForm from "@/app/Components/AskQuestions";
import { BsFillPencilFill } from "react-icons/bs";
import { AiOutlineDelete } from "react-icons/ai";
import QuestionForm from "@/app/Components/QuestionForm";
import ResponseModal from "@/app/Components/ResponseModal";
import QuestionComments from "@/app/Components/QuestionComment";
import Loader from "@/app/Components/Loader";
import { QuestionDetailSkeleton } from "@/app/Components/Skeleton";

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import("react-quill-new"), {
  ssr: false,
  loading: () => (
    <div className="h-64 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg"></div>
  ),
});
import "react-quill-new/dist/quill.snow.css";

// Memoized scrollbar styles
const customScrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 2px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`;

export default function QuestionDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, isSignedIn } = useUser();

  // Main state
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showInputModal, setShowInputModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [showAnswerEditor, setShowAnswerEditor] = useState(false);
  const [actionLoading, setActionLoading] = useState({
    vote: false,
    bookmark: false,
    share: false,
  });

  // Category management state
  const [categories, setCategories] = useState([]);
  const [categoryInput, setCategoryInput] = useState("");
  const [questionCategories, setQuestionCategories] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const inputRef = useRef(null);
  const [users, setUsers] = useState([]);

  const [modal, setModal] = useState({
    isOpen: false,
    message: "",
    status: "",
  });

  // Memoized handlers
  const showModal = useCallback((message, status) => {
    setModal({ isOpen: true, message, status });
  }, []);

  // Fetch question details with error handling
  const fetchQuestion = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/questions?id=${id}`);
      if (!res.ok) throw new Error("Failed to fetch question");
      const data = await res.json();
      if (!data.question) throw new Error("Question not found");
      setQuestion(data.question);
      // Initialize categories from the question data
      if (data.question.category && Array.isArray(data.question.category)) {
        setQuestionCategories(data.question.category);
      }
    } catch (err) {
      setError(err.message);
      showModal(err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [id, showModal]);

  // Fetch categories with error handling
  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories);
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
      showModal("Failed to fetch categories", "error");
    }
  }, [showModal]);

  // Fetch users with error handling
  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/user", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        next: { revalidate: 3600 }, // Cache for 1 hour
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users.data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  }, []);

  // Initialize data
  useEffect(() => {
    fetchQuestion();
    fetchCategories();
    fetchUsers();
  }, [fetchQuestion, fetchCategories, fetchUsers]);

  // Update suggestions when categoryInput changes
  useEffect(() => {
    const input = categoryInput.trim().toLowerCase();
    const filtered = categories.filter(
      (cat) =>
        cat.name.toLowerCase().includes(input) &&
        !questionCategories.some((qc) => qc._id === cat._id)
    );
    setSuggestions(filtered);
  }, [categoryInput, categories, questionCategories]);

  // Category management handlers
  const handleCategoryFocus = useCallback(() => {
    setShowSuggestions(true);
  }, []);

  const handleCategoryBlur = useCallback(() => {
    setTimeout(() => setShowSuggestions(false), 200);
  }, []);

  const handleCategoryChange = useCallback((e) => {
    setCategoryInput(e.target.value);
    setShowSuggestions(true);
  }, []);

  const handleCategorySelect = useCallback(
    (cat) => {
      if (!questionCategories.some((c) => c._id === cat._id)) {
        setQuestionCategories((prev) => [...prev, cat]);
      }
      setCategoryInput("");
      setShowSuggestions(false);
    },
    [questionCategories]
  );

  const handleAddNewCategory = useCallback(async () => {
    if (!user?.publicMetadata?.isAdmin) {
      showModal("Only admins can add new categories", "error");
      return;
    }
    if (!categoryInput.trim()) return;

    setIsAddingCategory(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: categoryInput.trim() }),
      });

      if (!res.ok) {
        throw new Error("Failed to add new category");
      }

      const newCat = await res.json();
      setCategories((prev) => [...prev, newCat]);
      setQuestionCategories((prev) => [...prev, newCat]);
      setCategoryInput("");
      setShowSuggestions(false);
      showModal("New category added successfully", "success");
    } catch (err) {
      showModal(err.message, "error");
    } finally {
      setIsAddingCategory(false);
    }
  }, [categoryInput, showModal, user?.publicMetadata?.isAdmin]);

  const removeCategory = useCallback((catId) => {
    setQuestionCategories((prev) => prev.filter((cat) => cat._id !== catId));
  }, []);

  // Answer submission handler
  const handleSubmitAnswer = useCallback(async () => {
    if (!answer.trim()) {
      showModal("Answer cannot be empty", "error");
      return;
    }
    if (!user?.publicMetadata?.isAdmin) {
      showModal("Only admins can answer questions", "error");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/questions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answer,
          userId: user.id,
          category: questionCategories.map((c) => c._id),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit answer");
      }

      const updatedQuestion = await res.json();
      setQuestion(updatedQuestion);
      setAnswer("");
      setShowAnswerEditor(false);
      showModal("Answer submitted successfully", "success");
    } catch (err) {
      showModal(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  }, [
    answer,
    id,
    questionCategories,
    showModal,
    user?.id,
    user?.publicMetadata?.isAdmin,
  ]);

  const handleHelpful = useCallback(async () => {
    if (!isSignedIn) {
      showModal("Please sign in to vote", "error");
      return;
    }
    if (question.status !== "answered") {
      showModal("You can only vote after the question is answered", "error");
      return;
    }

    setActionLoading((prev) => ({ ...prev, vote: true }));
    try {
      const res = await fetch(`/api/questions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      if (res.ok) {
        const updatedQuestion = await res.json();
        setQuestion({ ...question, ...updatedQuestion });
        const hasLiked = updatedQuestion.helpfulVotes.includes(user.id);
        showModal(
          hasLiked
            ? "জাযাকাল্লাহ! আল্লাহ আপনার উপকারে বরকত দিন"
            : "উপকৃত তুলে নেওয়া হয়েছে",
          "success"
        );
      } else {
        showModal("উপকৃত মার্ক করতে সমস্যা হয়েছে", "error");
        throw new Error("Failed to update vote");
      }
    } catch (err) {
      showModal(err.message, "error");
    } finally {
      setActionLoading((prev) => ({ ...prev, vote: false }));
    }
  }, [id, isSignedIn, question?.status, showModal, user?.id]);

  const handleDeleteQuestion = useCallback(async () => {
    if (!confirm("Are you sure you want to delete this question?")) return;

    if (!user?.publicMetadata?.isAdmin && user?.id !== question?.userId) {
      showModal(
        "You must be an admin or the question author to delete this question",
        "error"
      );
      return;
    }

    try {
      const res = await fetch(`/api/questions/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete question");
      }

      showModal("Question deleted successfully", "success");
      router.push("/questionnaires");
    } catch (err) {
      showModal(err.message || "Failed to delete question", "error");
    }
  }, [
    id,
    question?.userId,
    router,
    showModal,
    user?.id,
    user?.publicMetadata?.isAdmin,
  ]);

  const handleBookmark = useCallback(async () => {
    if (!isSignedIn) {
      showModal("Please sign in to bookmark", "error");
      return;
    }

    setActionLoading((prev) => ({ ...prev, bookmark: true }));
    try {
      const res = await fetch(`/api/questions/${id}/bookmark`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      if (res.ok) {
        const updatedQuestion = await res.json();
        setQuestion(updatedQuestion);
        showModal("বুকমার্ক সফল হয়েছে", "success");
      } else {
        showModal("বুকমার্ক করতে সমস্যা হয়েছে", "error");
        throw new Error("Failed to bookmark question");
      }
    } catch (err) {
      showModal(err.message, "error");
    } finally {
      setActionLoading((prev) => ({ ...prev, bookmark: false }));
    }
  }, [id, isSignedIn, showModal, user?.id]);

  const handleShare = useCallback(async () => {
    setActionLoading((prev) => ({ ...prev, share: true }));
    try {
      if (navigator.share) {
        await navigator.share({
          title: question.title,
          text: question.description,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        showModal("Link copied to clipboard!", "success");
      }
    } catch (err) {
      console.error("Error sharing:", err);
      showModal("Failed to share question", "error");
    } finally {
      setActionLoading((prev) => ({ ...prev, share: false }));
    }
  }, [question?.title, question?.description, showModal]);

  // Memoized user name getter
  const getUserName = useCallback(
    (id) => {
      const u = users.find((u) => u.id === id);
      return u ? `${u.firstName} ${u.lastName}` : "Unknown";
    },
    [users]
  );

  // Memoized voters list
  const names = useMemo(
    () => question?.helpfulVotes?.map(getUserName).filter(Boolean) || [],
    [question?.helpfulVotes, getUserName]
  );

  if (loading) return <QuestionDetailSkeleton />;
  if (error) return <div className="text-center text-red-500 p-8">{error}</div>;
  if (!question)
    return (
      <div className="text-center text-gray-500 p-8">Question not found</div>
    );

  const hasVoted = isSignedIn && question.helpfulVotes.includes(user?.id);
  const isBookmarked = isSignedIn && question.bookmarks?.includes(user?.id);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto p-4 min-h-screen space-y-8"
    >
      <style jsx global>
        {customScrollbarStyles}
      </style>

      {/* Question Section */}
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-6">
        {/* Edit & Delete Options - Top Right */}
        <div className="absolute top-4 right-4 flex gap-2">
          {isSignedIn && (
            <>
              {(user?.id === question.userId &&
                question.status === "pending") ||
              user?.publicMetadata?.isAdmin ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setEditingQuestion(question);
                    setShowInputModal(true);
                  }}
                  className="p-2 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors"
                  title="Edit Question"
                >
                  <HiOutlinePencil className="w-5 h-5" />
                </motion.button>
              ) : null}
              {user?.id === question.userId &&
                question.status === "pending" && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleDeleteQuestion}
                    className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                    title="Delete Question"
                  >
                    <HiOutlineTrash className="w-5 h-5" />
                  </motion.button>
                )}
            </>
          )}
        </div>

        <div className="space-y-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white pr-16">
            {question.title}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
            {question.description || "No description provided"}
          </p>
        </div>

        {/* Categories Section */}
        {questionCategories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {questionCategories.map((cat) => (
              <span
                key={cat._id}
                className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 rounded-full text-sm flex items-center gap-2"
              >
                {cat.name}
                {user?.publicMetadata?.isAdmin && showAnswerEditor && (
                  <button
                    onClick={() => removeCategory(cat._id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-600 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-100"
                  >
                    ✕
                  </button>
                )}
              </span>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
          <span
            className={`px-3 py-1 rounded-full ${
              question.status === "answered"
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
            }`}
          >
            {question.status === "answered" ? "উত্তর হয়েছে" : "উত্তর হয়নি"}
          </span>
          <span>
            প্রশ্নকারী:{" "}
            {question.isAnonymous ? "অজ্ঞাতনামা" : question.username}
            {question.isAnonymous &&
              user.publicMetadata.isAdmin &&
              " as " + getUserName(question.userId)}
          </span>
          <span>
            {question.createdAt &&
              formatDistanceToNow(new Date(question.createdAt), {
                addSuffix: true,
                locale: bn,
              })}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-2 pt-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleShare}
            disabled={actionLoading.share}
            className={`p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors ${
              actionLoading.share ? "opacity-50 cursor-not-allowed" : ""
            }`}
            title="Share Question"
          >
            <FiShare2 className="w-5 h-5" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleBookmark}
            disabled={actionLoading.bookmark}
            className={`p-2 rounded-full transition-colors ${
              isBookmarked
                ? "text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20"
                : "text-gray-500 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
            } ${actionLoading.bookmark ? "opacity-50 cursor-not-allowed" : ""}`}
            title={isBookmarked ? "Remove Bookmark" : "Bookmark Question"}
          >
            {isBookmarked ? (
              <FaBookmark className="w-5 h-5" />
            ) : (
              <FaRegBookmark className="w-5 h-5" />
            )}
          </motion.button>
        </div>
      </div>

      {/* Answer Section */}
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-6">
        {/* Edit Answer Button - Top Right */}
        {user?.publicMetadata?.isAdmin && question.answer && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setAnswer(question.answer);
              setShowAnswerEditor(true);
            }}
            className="absolute top-4 right-4 p-2 text-green-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-full transition-colors"
            title="Edit Answer"
          >
            <HiOutlinePencil className="w-5 h-5" />
          </motion.button>
        )}

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              উত্তর
            </h2>
            {question.answer && (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                <p>
                  উত্তর প্রদানের তারিখ:{" "}
                  {new Date(question.answeredAt).toLocaleDateString()}
                </p>
                <p>উত্তর প্রদানেঃ মাওলানা মুহাম্মদ নিজাম উদ্দীন রশিদী</p>
              </div>
            )}
          </div>

          {question.answer ? (
            <div className="space-y-6">
              <div
                className="prose dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: question.answer }}
              />
              <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="relative group">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleHelpful}
                    disabled={
                      !isSignedIn ||
                      question.status !== "answered" ||
                      actionLoading.vote
                    }
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                      question.status !== "answered"
                        ? "bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed"
                        : hasVoted
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
                    } ${
                      actionLoading.vote ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    title={
                      question.status !== "answered"
                        ? "Wait for the answer to vote"
                        : "Mark as helpful"
                    }
                  >
                    {hasVoted ? (
                      <BsHandThumbsUpFill className="w-5 h-5" />
                    ) : (
                      <BsHandThumbsUp className="w-5 h-5" />
                    )}
                    <span>
                      উপকৃত হলাম ({question.helpfulVotes?.length || 0})
                    </span>
                  </motion.button>

                  {/* Voters List Tooltip */}
                  <AnimatePresence>
                    {names.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 bottom-full mb-2 hidden group-hover:block z-50"
                      >
                        <div className="bg-gray-900 text-white text-sm rounded-lg shadow-lg p-3 min-w-[200px] max-w-[300px]">
                          <div className="absolute bottom-0 right-4 transform translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900"></div>
                          <div className="font-medium mb-2 text-green-400">
                            উপকৃত ব্যক্তিবর্গ:
                          </div>
                          <div className="space-y-1 max-h-[200px] overflow-y-auto custom-scrollbar">
                            {names.map((name, index) => (
                              <div
                                key={index}
                                className="flex items-center space-x-2 py-1 px-2 rounded hover:bg-gray-800 transition-colors"
                              >
                                <span className="w-5 h-5 flex items-center justify-center bg-green-500/20 text-green-400 rounded-full text-xs">
                                  {index + 1}
                                </span>
                                <span className="truncate">{name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          ) : !showAnswerEditor ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {user?.publicMetadata?.isAdmin
                  ? "No answer provided yet. You can provide an answer below."
                  : "No answer provided yet. Please wait for an admin to answer."}
              </p>
              {user?.publicMetadata?.isAdmin && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowAnswerEditor(true)}
                  className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  Provide Answer
                </motion.button>
              )}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 space-y-6"
            >
              {/* Category Management Section */}
              {user?.publicMetadata?.isAdmin && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    প্রশ্নের বিষয়বস্তু
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {questionCategories.map((cat) => (
                      <motion.span
                        key={cat._id}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="group relative px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 rounded-full text-sm flex items-center gap-2"
                      >
                        {cat.name}
                        <button
                          onClick={() => removeCategory(cat._id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-600 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-100"
                        >
                          ✕
                        </button>
                      </motion.span>
                    ))}
                  </div>
                  <div className="relative">
                    <input
                      ref={inputRef}
                      type="text"
                      value={categoryInput}
                      onChange={handleCategoryChange}
                      onFocus={handleCategoryFocus}
                      onBlur={handleCategoryBlur}
                      placeholder="বিষয়বস্তু যোগ করুন..."
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                    {showSuggestions && suggestions.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-48 overflow-y-auto"
                      >
                        {suggestions.map((cat) => (
                          <button
                            key={cat._id}
                            onClick={() => handleCategorySelect(cat)}
                            className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                          >
                            {cat.name}
                          </button>
                        ))}
                      </motion.div>
                    )}
                    {categoryInput.trim() &&
                      !suggestions.some(
                        (cat) =>
                          cat.name.toLowerCase() ===
                          categoryInput.trim().toLowerCase()
                      ) && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleAddNewCategory}
                          disabled={isAddingCategory}
                          className={`absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 transition-colors ${
                            isAddingCategory
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }`}
                        >
                          {isAddingCategory ? "যোগ হচ্ছে..." : "নতুন যোগ করুন"}
                        </motion.button>
                      )}
                  </div>
                </div>
              )}

              <ReactQuill
                theme="snow"
                value={answer}
                onChange={setAnswer}
                className="h-64 mb-12"
              />
              <div className="flex justify-end space-x-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setShowAnswerEditor(false);
                    setAnswer("");
                  }}
                  className="px-6 py-2 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSubmitAnswer}
                  disabled={submitting || !answer.trim()}
                  className={`px-6 py-2 rounded-lg transition-colors ${
                    submitting || !answer.trim()
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-green-500 hover:bg-green-600"
                  } text-white`}
                >
                  {submitting ? "Submitting..." : "Submit Answer"}
                </motion.button>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Comments Section */}
      {question.answer && <QuestionComments questionId={question._id} />}

      {/* Edit Question Modal */}
      {showInputModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowInputModal(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-white dark:bg-gray-900 rounded-xl shadow-lg w-full max-w-2xl p-6 mx-4"
          >
            <button
              onClick={() => setShowInputModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
            >
              ✕
            </button>
            <AskQuestionForm
              initialQuestion={editingQuestion}
              onQuestionSubmitted={async (data) => {
                try {
                  const res = await fetch(`/api/questions/${question._id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data),
                  });
                  if (res.ok) {
                    const updatedQuestion = await res.json();
                    setQuestion(updatedQuestion);
                    setShowInputModal(false);
                    showModal("Question updated successfully", "success");
                  } else {
                    throw new Error("Failed to update question");
                  }
                } catch (err) {
                  showModal(err.message, "error");
                }
              }}
            />
          </motion.div>
        </div>
      )}

      {/* Response Modal */}
      <ResponseModal
        isOpen={modal.isOpen}
        message={modal.message}
        status={modal.status}
        onClose={() => setModal({ ...modal, isOpen: false })}
      />
    </motion.div>
  );
}
