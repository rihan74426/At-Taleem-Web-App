"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import dynamic from "next/dynamic";
import AskQuestionForm from "@/app/Components/AskQuestions";

// Dynamic import for ReactQuill (avoid SSR issues)
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });
import "react-quill-new/dist/quill.snow.css";
import { BsFillPencilFill } from "react-icons/bs";
import { AiOutlineDelete } from "react-icons/ai";

export default function QuestionDetailPage() {
  const { id } = useParams();
  const { user, isSignedIn } = useUser();

  // State Management
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);

  // Fetch Question Details
  const fetchQuestion = async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/questions?id=${id}`);
      if (!res.ok) throw new Error("Failed to fetch question");
      const data = await res.json();
      if (!data.question) throw new Error("Question not found");
      setQuestion(data.question);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestion();
  }, [id]);

  // Handle Answer Submission
  const handleSubmitAnswer = async () => {
    if (!answer.trim()) return alert("Answer cannot be empty");
    setSubmitting(true);

    try {
      const res = await fetch(`/api/questions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer, userId: user.id }),
      });

      if (res.ok) {
        const updatedQuestion = await res.json();
        setQuestion(updatedQuestion);
        setAnswer(""); // Clear input after submission
      } else {
        alert("Failed to submit answer.");
      }
    } catch (err) {
      console.error("Error submitting answer:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Question Deletion (Only if user is the owner)
  const handleDeleteQuestion = async () => {
    if (!confirm("Are you sure you want to delete this question?")) return;
    try {
      const res = await fetch(`/api/questions/${id}`, { method: "DELETE" });
      if (res.ok) {
        // Redirect after deletion if needed
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
    <div className="max-w-3xl mx-auto p-4 min-h-screen">
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
        {question.isAnonymous ? "অজ্ঞাতনামা" : question.username}
      </p>

      {/* Edit & Delete (Only for the question owner) */}
      {(isSignedIn && user?.id === question.userId) ||
        (user?.publicMetadata.isAdmin && question.status === "pending" && (
          <div className="mt-3 flex gap-3">
            <button
              onClick={() => {
                setEditingQuestion(question);
                setShowModal(true);
              }}
              className="text-blue-500 p-2 "
            >
              <BsFillPencilFill />
            </button>
            <button onClick={handleDeleteQuestion} className="text-red-500 p-2">
              <AiOutlineDelete />
            </button>
          </div>
        ))}

      {/* Answer Section */}
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2 border-b">উত্তর</h2>
        {question.answer ? (
          <div className="p-3 mb-2">
            <p
              className="text-gray-500"
              dangerouslySetInnerHTML={{ __html: question.answer }}
            />
            <p className="text-gray-500">
              উত্তর প্রদানের তারিখঃ{" "}
              {new Date(question.answeredAt).toLocaleDateString()}
            </p>
            <span className="text-sm text-gray-500">
              উত্তর প্রদানেঃ মাওলানা মুহাম্মদ নিজাম উদ্দীন রশিদী
            </span>
          </div>
        ) : (
          <p className="text-gray-500">Not answered yet.</p>
        )}

        {/* Answer Submission (Only for Admins) */}
        {user?.publicMetadata.isAdmin && question.status === "pending" && (
          <div className="mt-4">
            <ReactQuill
              theme="snow"
              placeholder="উত্তর লিখুন..."
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

      {/* Comments Section (Reused from Video Comments Component) */}
      {/* <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Discussion</h2>
        <VideoComments entityId={id} entityType="question" />
      </div> */}
    </div>
  );
}
