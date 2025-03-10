"use client";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";

export default function VideoComments({ videoId }) {
  const [comments, setComments] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [newComment, setNewComment] = useState("");
  const [error, setError] = useState("");
  const user = useUser();

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/comments?videoId=${videoId}`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments);
        setTotal(data.total);
        setPage(data.page);
      }
    } catch (err) {
      console.error("Error fetching comments:", err);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [videoId]);

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      // Replace these with actual user data, perhaps from Clerk authentication
      const userId = user?.user.id;
      const username = user?.user.fullName; // Replace with actual username

      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId,
          userId,
          username,
          content: newComment,
        }),
      });
      if (res.ok) {
        setNewComment("");
        fetchComments();
      } else {
        const data = await res.json();
        setError(data.error || "Error adding comment");
      }
    } catch (err) {
      console.error("Error adding comment:", err);
      setError("Error adding comment");
    }
  };

  return (
    <div className="dark:text-white text-black">
      <h2 className="text-4xl font-bold mb-4 text-center">Comments</h2>
      {user.isSignedIn ? (
        <form onSubmit={handleCommentSubmit} className="mb-6">
          <textarea
            className="w-full border rounded p-2 dark:bg-black"
            placeholder="Add your comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            required
          />
          {error && <p className="text-red-500">{error}</p>}
          <button
            type="submit"
            className="mt-2 bg-blue-500 text-white px-4 py-2 rounded"
          >
            Submit Comment
          </button>
        </form>
      ) : (
        <p className="text-red-500 text-center">
          Please sign in to add a comment.
        </p>
      )}
      <ul className="space-y-4">
        {comments.map((comment) => (
          <li key={comment._id} className="border-b pb-2">
            <p className="font-semibold italic">
              {comment.username}{" "}
              {user?.user?.publicMetadata?.isAdmin && (
                <span className="text-blue-300 bg-slate-600">Admin</span>
              )}
              :
            </p>
            <p>{comment.content}</p>
            <p className="text-xs text-gray-500">
              {new Date(comment.createdAt).toLocaleString()}
            </p>
          </li>
        ))}
      </ul>
      {/* <div className="flex justify-between items-center mt-4">
        <button
          onClick={() => fetchComments(page - 1)}
          disabled={page === 1}
          className="bg-gray-300 px-4 py-2 rounded"
        >
          Previous
        </button>
        <span>Page {page}</span>
        <button
          onClick={() => fetchComments(page + 1)}
          disabled={comments.length < limit}
          className="bg-gray-300 px-4 py-2 rounded"
        >
          Next
        </button>
      </div> */}
    </div>
  );
}
