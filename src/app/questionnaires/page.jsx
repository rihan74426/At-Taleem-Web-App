"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import AskQuestionForm from "../Components/AskQuestions";
import { HiOutlinePencil } from "react-icons/hi";
import { AiOutlineDelete } from "react-icons/ai";
import ResponseModal from "../Components/ResponseModal";
import Loader from "../Components/Loader";

export default function QuestionnairePage() {
  const { user, isSignedIn } = useUser();

  // State Management
  const [questions, setQuestions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resModal, setResModal] = useState({
    isOpen: false,
    message: "",
    status: "",
  });

  const showResModal = (message, status) => {
    setResModal({ isOpen: true, message, status });
  };
  // Fetch questions from the API
  const fetchQuestions = async () => {
    setLoading(true);
    try {
      let url = `/api/questions?page=${page}&limit=10`;
      if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;
      if (statusFilter !== "all") url += `&status=${statusFilter}`;
      if (selectedCategory !== "all") url += `&category=${selectedCategory}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setQuestions(data.questions);
        setTotalPages(data.totalPages);
      }
      setLoading(false);
    } catch (err) {
      setLoading(false);

      console.error("Error fetching questions:", err);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories);
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  // Refetch when filters or page changes
  useEffect(() => {
    fetchQuestions();
    fetchCategories();
  }, [page, searchTerm, statusFilter, selectedCategory]);

  // Handle question submission (for new & edited questions)
  const handleQuestionSubmit = (newQuestion) => {
    setShowModal(false);
    setEditingQuestion(null);
    fetchQuestions(); // Refetch questions after submission
  };

  // Handle question deletion
  const handleDeleteQuestion = async (question) => {
    if (!confirm("Are you sure you want to delete this question?")) return;

    if (!user?.publicMetadata?.isAdmin || user?.id === question.userId) {
      resModal.isOpen = true;
      showResModal(
        "You have to be an Admin or the asker to change anything restricted",
        "error"
      );
    } else {
      try {
        setLoading(true);
        const res = await fetch(`/api/questions/${question.questionId}`, {
          method: "DELETE",
        });
        if (res.ok) fetchQuestions();
      } catch (err) {
        setLoading(false);
        console.error("Error deleting question:", err);
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800 py-8">
      <div className="container mx-auto px-4 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            প্রশ্নোত্তরসমূহ
          </h1>
          <button
            onClick={() => {
              setEditingQuestion(null);
              setShowModal(true);
            }}
            className="self-start md:self-auto px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            প্রশ্ন করুন
          </button>
        </div>

        {/* Search & Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="প্রশ্ন খুঁজুন..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="border p-2 rounded w-full bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
          />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="border p-2 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
          >
            <option value="all">সকল প্রকার</option>
            <option value="pending">উত্তর হয়নি</option>
            <option value="answered">উত্তর হয়েছে</option>
          </select>
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1);
            }}
            className="border p-2 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
          >
            <option value="all">সকল ক্যাটেগরি</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Question List */}
        {loading ? (
          <div className=" p-3 flex place-content-center items-center">
            <Loader />
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {questions.map((q) => (
              <QuestionCard
                key={q._id}
                question={q}
                categories={categories}
                isSignedIn={isSignedIn}
                user={user}
                onEdit={() => {
                  setEditingQuestion(q);
                  setShowModal(true);
                }}
                onDelete={() => handleDeleteQuestion(q)}
              />
            ))}
          </div>
        )}
      </div>
      {/* Pagination */}
      <div className="flex mt-auto justify-center gap-2 space-x-2">
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i}
            onClick={() => setPage(i + 1)}
            className={`px-3 py-1 mt-5 border rounded ${
              page === i + 1
                ? "bg-blue-600 text-white"
                : "bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* Modal for Ask/Edit */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-lg w-full max-w-md p-6">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
            >
              ✕
            </button>
            <AskQuestionForm
              initialQuestion={editingQuestion}
              onQuestionSubmitted={() => {
                handleQuestionSubmit();
                setShowModal(false);
                setPage(1);
              }}
            />
          </div>
        </div>
      )}
      <ResponseModal
        isOpen={resModal.isOpen}
        message={resModal.message}
        status={resModal.status}
        onClose={() => setResModal({ ...resModal, isOpen: false })}
      />
    </div>
  );
}

export function QuestionCard({
  question,
  categories,
  isSignedIn,
  user,
  onEdit,
  onDelete,
}) {
  return (
    <div className="bg-white dark:bg-gray-900 border rounded-lg shadow hover:shadow-lg transition p-6 flex flex-col justify-between">
      <Link href={`/questionnaires/${question._id}`}>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          {question.title}
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          {question.description?.length > 100
            ? `${question.description.substring(0, 100)}...`
            : question.description || "বিস্তারিত নেই"}
        </p>
      </Link>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <span
          className={`px-2 py-1 rounded ${
            question.status === "answered"
              ? "bg-green-200 text-green-800"
              : "bg-yellow-200 text-yellow-800"
          }`}
        >
          {question.status.charAt(0).toUpperCase() + question.status.slice(1)}
        </span>
        <span>
          প্রশ্নকারী: {question.isAnonymous ? "অজ্ঞাতনামা" : question.username}
        </span>
        <span>তারিখ: {new Date(question.createdAt).toLocaleDateString()}</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {categories.length > 0 &&
          categories
            .filter((cat) => question.category.includes(cat._id))
            .map((cat) => (
              <span
                key={cat._id}
                className="bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100 px-3 py-1 rounded-full text-sm"
              >
                {cat.name}
              </span>
            ))}
      </div>
      {((isSignedIn && user?.id === question.userId) ||
        (user?.publicMetadata.isAdmin && question.status === "pending")) && (
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onEdit}
            className="text-blue-500 hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded"
          >
            <HiOutlinePencil size={20} />
          </button>
          <button
            onClick={onDelete}
            className="text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded"
          >
            <AiOutlineDelete size={20} />
          </button>
        </div>
      )}
    </div>
  );
}
