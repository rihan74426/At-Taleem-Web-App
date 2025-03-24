"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function QuestionnairePage() {
  // State for questions and filters
  const [questions, setQuestions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // "all", "pending", "answered"
  const [selectedCategory, setSelectedCategory] = useState(""); // "" means all categories
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch questions from the API based on filters
  const fetchQuestions = async () => {
    try {
      let url = `/api/questions?page=${page}&limit=10`;
      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`;
      }
      if (statusFilter !== "all") {
        url += `&status=${statusFilter}`;
      }
      if (selectedCategory) {
        url += `&category=${selectedCategory}`;
      }
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

  // Refetch questions when filters or page change
  useEffect(() => {
    fetchQuestions();
  }, [page, searchTerm, statusFilter, selectedCategory]);

  return (
    <div className="max-w-4xl mx-auto p-4 min-h-screen">
      {/* Top Section with Search & Filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <input
          type="text"
          placeholder="Search questions..."
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
            <option value="">All Categories</option>
            {/* Replace with dynamic options from your centralized category store */}
            <option value="tech">Tech</option>
            <option value="education">Education</option>
            <option value="health">Health</option>
          </select>
        </div>
      </div>

      {/* Question List */}
      <ul className="space-y-4">
        {questions.map((question) => (
          <li
            key={question._id}
            className="border p-4 rounded shadow hover:shadow-lg transition"
          >
            <Link href={`/questionnaires/${question._id}`}>
              <a>
                <h2 className="text-xl font-bold mb-1">{question.title}</h2>
                <p className="text-gray-600">
                  {question.description
                    ? question.description.substring(0, 100) + "..."
                    : "No description."}
                </p>
                <div className="flex justify-between items-center mt-2">
                  <span
                    className={`px-2 py-1 text-sm rounded ${
                      question.status === "answered"
                        ? "bg-green-200 text-green-800"
                        : "bg-yellow-200 text-yellow-800"
                    }`}
                  >
                    {question.status.charAt(0).toUpperCase() +
                      question.status.slice(1)}
                  </span>
                  <span className="text-gray-500 text-sm">
                    {new Date(question.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-700">
                  Asked by: {question.username || "Anonymous"}
                </p>
              </a>
            </Link>
          </li>
        ))}
      </ul>

      {/* Pagination Controls */}
      <div className="flex justify-center gap-2 mt-6">
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
    </div>
  );
}
