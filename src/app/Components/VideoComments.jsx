"use client";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";

export default function VideoComments({ videoId }) {
  const [comments, setComments] = useState([]);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [expandedComments, setExpandedComments] = useState({});
  const [newComment, setNewComment] = useState("");
  const user = useUser();

  const fetchComments = async (parentComment = null) => {
    try {
      const res = await fetch(
        `/api/comments?videoId=${videoId}&parentComment=${parentComment || ""}`
      );
      if (res.ok) {
        const data = await res.json();
        if (parentComment) {
          setExpandedComments((prev) => ({
            ...prev,
            [parentComment]: data.comments,
          }));
        } else {
          setComments(data.comments);
        }
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
    if (!user?.user) return alert("You must be logged in to comment.");

    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        videoId,
        userId: user?.user.id,
        username: user?.user.fullName,
        content: newComment,
      }),
    });

    if (res.ok) {
      setNewComment("");
      fetchComments();
    }
  };

  const handleReplySubmit = async (e, parentComment) => {
    e.preventDefault();
    if (!user?.user) return alert("You must be logged in to reply.");

    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        videoId,
        userId: user?.user.id,
        username: user?.user.fullName,
        content: replyText,
        parentComment,
      }),
    });

    if (res.ok) {
      setReplyText("");
      setReplyingTo(null);
      fetchComments(parentComment);
    }
  };

  const handleLike = async (commentId) => {
    if (!user?.user) return alert("You must be logged in to like a comment.");

    await fetch("/api/comments", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commentId, userId: user?.user.id }),
    });

    fetchComments();
  };

  return (
    <div className="dark:text-white text-black">
      <h2 className="text-4xl font-bold mb-4 text-center">Comments</h2>

      {/* Comment Input */}
      {user?.user ? (
        <form onSubmit={handleCommentSubmit} className="mb-4">
          <textarea
            className="w-full border rounded p-2 dark:bg-black"
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            required
          />
          <button
            type="submit"
            className="mt-2 bg-blue-500 text-white px-4 py-2 rounded"
          >
            Submit
          </button>
        </form>
      ) : (
        <p className="text-gray-500 text-center">Log in to comment.</p>
      )}

      <ul className="space-y-4">
        {comments.map((comment) => (
          <li key={comment._id} className="border-b pb-2">
            <p className="font-semibold italic">{comment.username}</p>
            <p>{comment.content}</p>
            <div className="flex items-center gap-3 text-gray-500 text-sm">
              <button
                onClick={() => handleLike(comment._id)}
                className="text-blue-400 hover:text-blue-600"
              >
                👍 {comment?.likes?.length}
              </button>
              <button
                onClick={() => setReplyingTo(comment._id)}
                className="text-green-400 hover:text-green-600"
              >
                Reply
              </button>
              <button
                onClick={() => fetchComments(comment._id)}
                className="text-orange-400 hover:text-orange-600"
              >
                {expandedComments[comment._id]
                  ? "Hide Replies"
                  : "View Replies"}
              </button>
            </div>

            {replyingTo === comment._id && (
              <form
                onSubmit={(e) => handleReplySubmit(e, comment._id)}
                className="mt-2"
              >
                <textarea
                  className="w-full border rounded p-2 dark:bg-black"
                  placeholder="Write a reply..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  required
                />
                <button
                  type="submit"
                  className="mt-2 bg-blue-500 text-white px-4 py-2 rounded"
                >
                  Submit Reply
                </button>
              </form>
            )}

            {expandedComments[comment._id] &&
              expandedComments[comment._id].map((reply) => (
                <div key={reply._id} className="ml-8 mt-2 border-l pl-4">
                  <p className="font-semibold">{reply.username}</p>
                  <p>{reply.content}</p>
                </div>
              ))}
          </li>
        ))}
      </ul>
    </div>
  );
}
