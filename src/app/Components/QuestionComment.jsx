"use client";
import { SignInButton, useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { AiFillEdit } from "react-icons/ai"; // Example edit icon
import { BsTrash } from "react-icons/bs"; // Example delete icon

export default function QuestionComments({ questionId }) {
  const [comments, setComments] = useState([]);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [newComment, setNewComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const user = useUser();

  // Fetch comments (including nested replies via population in API)
  const fetchComments = async () => {
    try {
      const res = await fetch(
        `/api/comments?entityId=${questionId}&commentType=question`
      );
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments);
      }
    } catch (err) {
      console.error("Error fetching comments:", err);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [questionId]);

  // Submit a new comment
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!user?.user) return alert("You must be logged in to comment.");
    if (!newComment.trim()) return;

    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entityId: questionId,
        commentType: "question",
        userId: user?.user.id,
        username: user?.user.fullName,
        content: newComment.trim(),
      }),
    });

    if (res.ok) {
      setNewComment("");
      fetchComments();
    }
  };

  // Submit a reply (nested comment)
  const handleReplySubmit = async (e, parentComment) => {
    e.preventDefault();
    if (!user?.user) return alert("You must be logged in to reply.");
    if (!replyText.trim()) return;

    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entityId: questionId,
        commentType: "question",
        userId: user?.user.id,
        username: user?.user.fullName,
        content: replyText.trim(),
        parentComment, // Associate reply with parent comment
      }),
    });

    if (res.ok) {
      setReplyText("");
      setReplyingTo(null);
      fetchComments();
    }
  };

  // Like/unlike a comment or reply
  const handleLike = async (commentId) => {
    if (!user?.user) return alert("You must be logged in to like a comment.");

    const res = await fetch("/api/comments", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commentId, userId: user?.user.id }),
    });

    if (res.ok) {
      fetchComments();
    }
  };

  // Start editing a comment
  const handleStartEdit = (comment) => {
    setEditingCommentId(comment._id);
    setEditingText(comment.content);
  };

  // Submit an edit
  const handleEditSubmit = async (e, commentId) => {
    e.preventDefault();
    if (!editingText.trim()) return;
    const res = await fetch(`/api/comments/${commentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: editingText.trim() }),
    });
    if (res.ok) {
      setEditingCommentId(null);
      setEditingText("");
      fetchComments();
    }
  };

  // Delete a comment
  const handleDelete = async (commentId) => {
    if (!window.confirm("Are you sure you want to delete this comment?"))
      return;
    const res = await fetch(`/api/comments/${commentId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      fetchComments();
    }
  };

  return (
    <div className="dark:text-white text-black mt-10">
      <h2 className="text-4xl font-bold mb-4 text-center">Comments</h2>

      {/* Primary Comment Input */}
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
        <p className="text-gray-500 text-center">
          Please Log in to comment. <SignInButton />
        </p>
      )}

      {/* Comments & Replies List */}
      <ul className="space-y-4">
        {comments.map((comment) => (
          <li key={comment._id} className="border-b pb-2">
            <div className="flex items-center justify-between">
              <p className="font-semibold italic">{comment.username}</p>
            </div>

            {editingCommentId === comment._id ? (
              <form
                onSubmit={(e) => handleEditSubmit(e, comment._id)}
                className="mt-2"
              >
                <textarea
                  className="w-full border rounded p-2 dark:bg-black"
                  value={editingText}
                  onChange={(e) => setEditingText(e.target.value)}
                  required
                />
                <button
                  type="submit"
                  className="mt-2 bg-blue-500 text-white p-1 px-3 rounded"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setEditingCommentId(null)}
                  className="mt-2 ml-2 bg-red-300 hover:bg-red-500 text-black p-1 rounded"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <p>{comment.content}</p>
            )}

            <div className="flex items-center gap-3 text-gray-500 text-sm">
              <button
                onClick={() => handleLike(comment._id)}
                className="text-blue-400 hover:text-blue-600"
              >
                ❤️ {comment?.likes?.length || 0}
              </button>
              <button
                onClick={() => {
                  if (!user?.user) alert("You must be logged in to reply.");
                  else setReplyingTo(comment._id);
                }}
                className="text-green-400 hover:text-green-600"
              >
                Reply
              </button>
              {user?.user?.id === comment.userId && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleStartEdit(comment)}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(comment._id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>

            {replyingTo === comment._id && (
              <form
                onSubmit={(e) => handleReplySubmit(e, comment._id)}
                className="mt-2 border-l ml-8 p-2"
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
                  className="m-2 bg-blue-500 text-white p-1 rounded"
                >
                  Reply
                </button>
                <button
                  type="cancel"
                  onClick={() => setReplyingTo(null)}
                  className="m-2 bg-red-500 text-white p-1 rounded"
                >
                  Cancel
                </button>
              </form>
            )}

            {comment.replies &&
              comment.replies.map((reply) => (
                <div key={reply._id} className="ml-8 mt-2 border-l pl-4">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{reply.username}</p>
                  </div>

                  {editingCommentId === reply._id ? (
                    <form
                      onSubmit={(e) => handleEditSubmit(e, reply._id)}
                      className="mt-2"
                    >
                      <textarea
                        className="w-full border rounded p-2 dark:bg-black"
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        required
                      />
                      <button
                        type="submit"
                        className="m-2 bg-blue-500 text-white p-1 px-3 rounded"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingCommentId(null)}
                        className="m-2 bg-red-300 hover:bg-red-500 text-black p-1 rounded"
                      >
                        Cancel
                      </button>
                    </form>
                  ) : (
                    <p>{reply.content}</p>
                  )}

                  <div className="flex items-center gap-3 text-gray-500 text-sm">
                    <button
                      onClick={() => handleLike(reply._id)}
                      className="text-blue-400 hover:text-blue-600"
                    >
                      ❤️ {reply?.likes?.length || 0}
                    </button>
                    {user?.user?.id === reply.userId && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleStartEdit(reply)}
                          className="text-blue-500  hover:text-blue-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(reply._id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </li>
        ))}
      </ul>
    </div>
  );
}
