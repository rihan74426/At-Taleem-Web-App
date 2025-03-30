"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import dynamic from "next/dynamic";
import AskQuestionForm from "@/app/Components/AskQuestions";
import { BsFillPencilFill } from "react-icons/bs";
import { AiOutlineDelete } from "react-icons/ai";

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });
import "react-quill-new/dist/quill.snow.css";
import { HiOutlinePencil } from "react-icons/hi";

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
  const [showModal, setShowModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [showAnswerEditor, setShowAnswerEditor] = useState(false);

  // Category management state (admin only)
  const [categories, setCategories] = useState([]); // All available categories from the store
  const [categoryInput, setCategoryInput] = useState("");
  const [questionCategories, setQuestionCategories] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);

  // Fetch question details
  const fetchQuestion = async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/questions?id=${id}`);
      if (!res.ok) throw new Error("Failed to fetch question");
      const data = await res.json();
      if (!data.question) throw new Error("Question not found");
      setQuestion(data.question);
      if (data.question.category) {
        setQuestionCategories(data.question.category);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch available categories from centralized store
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

  useEffect(() => {
    fetchQuestion();
    fetchCategories();
  }, [id]);

  // Update suggestions when categoryInput, categories, or questionCategories change
  useEffect(() => {
    const input = categoryInput.trim().toLowerCase();
    const filtered = categories.filter(
      (cat) =>
        cat.name.toLowerCase().includes(input) &&
        !questionCategories.some((qc) => qc._id === cat._id)
    );
    setSuggestions(filtered);
  }, [categoryInput, categories, questionCategories]);

  // Handlers for input focus and blur
  const handleFocus = () => {
    setShowSuggestions(true);
  };

  const handleBlur = () => {
    setTimeout(() => setShowSuggestions(false), 100);
  };

  // Handle input change
  const handleChange = (e) => {
    setCategoryInput(e.target.value);
  };

  // Handle selecting an existing category
  const handleSelect = (cat) => {
    if (!questionCategories.some((c) => c._id === cat._id)) {
      const updated = [...questionCategories, cat];
      setQuestionCategories(updated);
    }
    setCategoryInput("");
    setShowSuggestions(false);
  };

  // Create a new category if none match the input and select it
  const handleAddNewCategory = async () => {
    if (!categoryInput.trim()) return;
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: categoryInput.trim() }),
      });
      if (res.ok) {
        const newCat = await res.json();
        setCategories((prev) => [...prev, newCat]);
        setQuestionCategories((prev) => [...prev, newCat]);
        setCategoryInput("");
        setShowSuggestions(false);
      }
    } catch (err) {
      console.error("Error adding new category:", err);
    }
  };

  // Remove a category from the question
  const removeCategory = (catId) => {
    setQuestionCategories((prev) => prev.filter((cat) => cat._id !== catId));
  };

  // Handle answer submission (admin)
  const handleSubmitAnswer = async () => {
    if (!answer.trim()) return alert("Answer cannot be empty");
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
      if (res.ok) {
        const updatedQuestion = await res.json();
        setQuestion(updatedQuestion);
        setAnswer("");
        setShowAnswerEditor(false);
      } else {
        alert("Failed to submit answer.");
      }
    } catch (err) {
      console.error("Error submitting answer:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle question deletion (only for owner)
  const handleDeleteQuestion = async () => {
    if (!confirm("Are you sure you want to delete this question?")) return;
    try {
      const res = await fetch(`/api/questions/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/questionnaires");
      }
    } catch (err) {
      console.error("Error deleting question:", err);
    }
  };

  if (loading)
    return <p className="text-center text-gray-500 min-h-screen">Loading...</p>;
  if (error)
    return <p className="text-center text-red-500 min-h-screen">{error}</p>;
  if (!question)
    return (
      <p className="text-center text-gray-500 min-h-screen">
        No question found
      </p>
    );

  return (
    <div className="max-w-3xl mx-auto p-4 min-h-screen space-y-6 relative">
      {/* Question Header */}
      <h1 className="text-2xl font-bold mb-2">প্রশ্নঃ {question.title}</h1>
      <p className="text-gray-600">
        বিস্তারিতঃ {question.description || "No description provided."}
      </p>

      {/* Status & Meta Info */}
      <div className="flex justify-between items-center mt-2 text-sm text-gray-500">
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
          জমাদানের তারিখঃ {new Date(question.createdAt).toLocaleDateString()}
        </span>
      </div>

      {/* Author Info */}
      <p className="mt-1 text-sm text-gray-500">
        প্রশ্নটি করেছেনঃ{" "}
        {user?.publicMetadata?.isAdmin && question.isAnonymous
          ? question.username + " as "
          : ""}
        {question.isAnonymous ? "অজ্ঞাতনামা" : question.username}
      </p>

      {/* Edit & Delete Options */}
      {isSignedIn &&
        ((user?.id === question.userId && question.status === "pending") ||
          user?.publicMetadata.isAdmin) && (
          <div className="mt-3 flex gap-3">
            <button
              onClick={() => {
                setEditingQuestion(question);
                setShowModal(true);
              }}
              className="bg-blue-500 text-white rounded p-2"
              title="Edit Question"
            >
              <HiOutlinePencil size={20} />
            </button>
            <button
              onClick={handleDeleteQuestion}
              className=" p-2 bg-red-500 text-white rounded"
              title="Delete Question"
            >
              <AiOutlineDelete size={20} />
            </button>
          </div>
        )}

      {/* Answer Section */}
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2 border-b inline">উত্তরঃ</h2>
        {question.answer ? (
          <div className="p-3 my-3 border rounded">
            {user?.publicMetadata.isAdmin && (
              <button
                title="Edit Answer"
                onClick={() => {
                  setShowAnswerEditor(true);
                  setAnswer(question.answer);
                }}
                className="mt-2 p-2  float-end bg-blue-500 text-white rounded"
              >
                <HiOutlinePencil />
              </button>
            )}
            <div
              className="p-5"
              dangerouslySetInnerHTML={{ __html: question.answer }}
            />
            <p className="text-gray-500 text-sm">
              উত্তর প্রদানের তারিখঃ{" "}
              {new Date(question.answeredAt).toLocaleDateString()}
            </p>
            <span className="text-sm text-gray-500">
              উত্তর প্রদানেঃ মাওলানা মুহাম্মদ নিজাম উদ্দীন রশিদী
            </span>
          </div>
        ) : (
          user?.publicMetadata.isAdmin && (
            <button
              onClick={() => setShowAnswerEditor(true)}
              className="mt-2 px-3 py-1 bg-green-500 text-white rounded"
            >
              Answer
            </button>
          )
        )}

        {showAnswerEditor && (
          <div className="mt-4">
            {/* Category selection for the question */}
            <div className="mb-4 relative">
              <label className="block mb-1 text-sm font-semibold">
                Assign Categories:
              </label>
              <div className="flex flex-wrap gap-2">
                {questionCategories.map((cat) => (
                  <div
                    key={cat._id}
                    className="flex items-center gap-1 bg-slate-700 text-blue-200 px-2 py-1 rounded hover:bg-red-500 hover:cursor-pointer"
                    onClick={() => removeCategory(cat._id)}
                    title="Click to remove"
                  >
                    <span>{cat.name}</span>
                    <span className="text-red-600">&times;</span>
                  </div>
                ))}
              </div>
              <input
                ref={inputRef}
                type="text"
                placeholder="Add a category..."
                value={categoryInput}
                onChange={handleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                className="w-full border p-2 rounded mt-2 dark:bg-black"
              />
              {showSuggestions && (
                <div className="absolute top-full left-0 right-0 border rounded bg-white dark:bg-gray-800 mt-1 z-10 max-h-48 overflow-auto">
                  {suggestions.length > 0 ? (
                    suggestions.map((cat) => (
                      <div
                        key={cat._id}
                        onMouseDown={() => handleSelect(cat)}
                        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"
                      >
                        {cat.name}
                      </div>
                    ))
                  ) : (
                    <div
                      onMouseDown={handleAddNewCategory}
                      className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"
                    >
                      Add "{categoryInput}" as a new category
                    </div>
                  )}
                </div>
              )}
            </div>

            <ReactQuill
              theme="snow"
              placeholder="Write your answer here..."
              className="h-72 mb-3"
              value={answer}
              onChange={setAnswer}
            />
            <button
              onClick={handleSubmitAnswer}
              disabled={submitting}
              className="mt-10 px-4 py-2 bg-green-500 text-white rounded"
            >
              {submitting ? "Submitting..." : "Submit Answer"}
            </button>
            <button
              onClick={() => {
                setShowAnswerEditor(false);
                setAnswer("");
              }}
              className="ml-3 mt-4 px-4 py-2 bg-gray-300 text-black rounded"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Edit Question Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className="bg-black/80 absolute inset-0"
            onClick={() => setShowModal(false)}
          ></div>
          <div className="relative p-5 sm:w-2/3 w-full lg:w-1/3 border rounded bg-gray-900 text-white shadow-sm">
            <button
              className="absolute right-5 top-2 text-gray-400 hover:text-white"
              onClick={() => setShowModal(false)}
            >
              ✖
            </button>
            <AskQuestionForm
              initialQuestion={editingQuestion}
              onQuestionSubmitted={() => {
                setShowModal(false);
                fetchQuestion();
              }}
            />
          </div>
        </div>
      )}

      {/* (Optional) Comments Section for follow-up discussion */}
      {/* <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Discussion</h2>
        <VideoComments entityId={id} entityType="question" />
      </div> */}
    </div>
  );
}
