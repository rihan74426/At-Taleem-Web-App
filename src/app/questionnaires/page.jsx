"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import AskQuestionForm from "../Components/AskQuestions";
import { HiOutlinePencil } from "react-icons/hi";
import { AiOutlineDelete } from "react-icons/ai";

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

  // Fetch questions from the API
  const fetchQuestions = async () => {
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
    } catch (err) {
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
  const handleDeleteQuestion = async (questionId) => {
    if (!confirm("Are you sure you want to delete this question?")) return;
    try {
      const res = await fetch(`/api/questions/${questionId}`, {
        method: "DELETE",
      });
      if (res.ok) fetchQuestions();
    } catch (err) {
      console.error("Error deleting question:", err);
    }
  };

  return (
    <div className="max-w-6xl flex flex-col mx-auto p-4 min-h-screen">
      {/* Top Section: Search & Filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <input
          type="text"
          placeholder="প্রশ্ন খুঁজুন..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(1);
          }}
          className="border p-2 rounded w-full md:w-1/3"
        />
        <div className="flex gap-4">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="border p-2 rounded dark:bg-black"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="answered">Answered</option>
          </select>
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1);
            }}
            className="border p-2 rounded dark:bg-black"
          >
            <option value="all">All</option>
            {categories.map((category) => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Ask a Question Button */}
      <div className="flex justify-center mb-6">
        <button
          onClick={() => setShowModal(true)}
          className="mb-4 px-4 py-2 bg-blue-500 text-white rounded"
        >
          তালিমে প্রশ্ন করুন
        </button>
      </div>

      {/* Question List */}
      <ul className="space-y-4 mb-5">
        {questions.map((question) => (
          <li
            key={question._id}
            className="border p-4 rounded shadow hover:shadow-lg transition"
          >
            <Link href={`/questionnaires/${question._id}`}>
              <h2 className="text-xl font-bold mb-1 cursor-pointer">
                {question.title}
              </h2>
              <p className="text-gray-600">
                {question.description
                  ? question.description.substring(0, 100) + "..."
                  : "No description."}
              </p>
            </Link>
            <div className="flex flex-col sm:grid sm:grid-cols-3 md:grid-cols-4  items-center gap-2 mt-2">
              {/* Status Badge */}
              <span
                className={`px-2  py-1 text-sm rounded w-2/3 text-center ${
                  question.status === "answered"
                    ? "bg-green-200 text-green-800"
                    : "bg-yellow-200 text-yellow-800"
                }`}
              >
                {question.status.charAt(0).toUpperCase() +
                  question.status.slice(1)}
              </span>

              {/* Asked By */}
              <p className="px-2 text-sm text-gray-500 w-full text-center sm:text-left">
                প্রশ্নটি করেছেন:{" "}
                {question.isAnonymous ? "অজ্ঞাতনামা" : question.username}
              </p>

              {/* Date Asked */}
              <span className="text-gray-500 px-2 text-sm w-full text-center">
                প্রশ্ন করার তারিখ:{" "}
                {new Date(question.createdAt).toLocaleDateString()}
              </span>

              {/* Edit & Delete Options */}
              {(isSignedIn && user?.id === question.userId) ||
                (user?.publicMetadata.isAdmin &&
                  question.status === "pending" && (
                    <div className="flex gap-2 w-full justify-center sm:justify-end">
                      <button
                        onClick={() => {
                          setEditingQuestion(question);
                          setShowModal(true);
                        }}
                        className="text-blue-500 p-2 rounded hover:bg-slate-300 dark:hover:bg-slate-800"
                        title="Edit Question"
                      >
                        <HiOutlinePencil size={20} />
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(question._id)}
                        className="text-red-500 p-2 rounded hover:bg-slate-300 dark:hover:bg-slate-800"
                        title="Delete Question"
                      >
                        <AiOutlineDelete size={20} />
                      </button>
                    </div>
                  ))}
            </div>
          </li>
        ))}
      </ul>

      {/* Pagination Controls */}
      <div className="flex mt-auto justify-center gap-2">
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i}
            onClick={() => setPage(i + 1)}
            className={`px-3 py-1 border rounded ${
              page === i + 1 ? "bg-blue-500 text-white" : "text-blue-500"
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* Modal for Asking / Editing a Question */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className="bg-black/80 absolute inset-0"
            onClick={() => setShowModal(false)}
          ></div>
          <div className="relative p-5 overflow-auto sm:w-2/3 w-full lg:w-1/3 border rounded dark:bg-gray-900 text-white shadow-sm">
            <button
              className="ml-auto absolute right-5 top-2 items-center rounded-lg bg-transparent p-1.5 text-sm text-gray-400 hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-gray-400 dark:hover:text-white"
              onClick={() => setShowModal(false)}
              title="Close"
            >
              <svg
                stroke="currentColor"
                fill="none"
                strokeWidth="2"
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                ></path>
              </svg>
            </button>
            <div className="mt-5">
              <AskQuestionForm
                initialQuestion={editingQuestion}
                onQuestionSubmitted={handleQuestionSubmit}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
