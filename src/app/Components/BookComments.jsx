"use client";
import { SignInButton, useUser } from "@clerk/nextjs";
import { useEffect, useState, useMemo } from "react";
import { AiFillEdit } from "react-icons/ai";
import { BsTrash } from "react-icons/bs";
import TimeAgo from "react-timeago";

export default function BookComments({ bookId }) {
  const [comments, setComments] = useState([]);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [newComment, setNewComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [users, setUsers] = useState([]);
  const { user } = useUser();

  // Fetch comments and users concurrently
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [commentsRes, usersRes] = await Promise.all([
          fetch(`/api/comments?entityId=${bookId}&commentType=book`),
          fetch("/api/user", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          }),
        ]);
        if (commentsRes.ok) {
          const data = await commentsRes.json();
          setComments(data.comments);
        }
        if (usersRes.ok) {
          const data = await usersRes.json();
          setUsers(data.users.data);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };
    fetchData();
  }, [bookId]);

  // Memoized user map for efficient name lookups
  const userMap = useMemo(() => {
    const map = {};
    users.forEach((u) => {
      map[u.id] = `${u.firstName} ${u.lastName}`;
    });
    return map;
  }, [users]);

  // Submit a new comment
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entityId: bookId,
        commentType: "book",
        userId: user.id,
        username: user.fullName,
        content: newComment.trim(),
      }),
    });

    if (res.ok) {
      setNewComment("");
      await fetchData();
    }
  };

  // Submit a reply
  const handleReplySubmit = async (e, parentCommentId) => {
    e.preventDefault();
    if (!user || !replyText.trim()) return;

    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entityId: bookId,
        commentType: "book",
        userId: user.id,
        username: user.fullName,
        content: replyText.trim(),
        parentComment: parentCommentId,
      }),
    });

    if (res.ok) {
      setReplyText("");
      setReplyingTo(null);
      await fetchData();
    }
  };

  // Like/unlike a comment or reply
  const handleLike = async (commentId) => {
    if (!user) {
      alert("You must be logged in to like a Book.");
      return;
    }

    const res = await fetch("/api/comments", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commentId, userId: user.id }),
    });

    if (res.ok) {
      await fetchData();
    }
  };

  // Start editing
  const handleStartEdit = (comment) => {
    setEditingCommentId(comment._id);
    setEditingText(comment.content);
  };

  // Submit edit
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
      await fetchData();
    }
  };

  // Delete comment
  const handleDelete = async (commentId) => {
    if (!window.confirm("Are you sure you want to delete this Comment?"))
      return;

    const res = await fetch(`/api/comments/${commentId}`, {
      method: "DELETE",
    });

    if (res.ok) {
      await fetchData();
    }
  };

  // Helper to fetch data (for reuse after actions)
  const fetchData = async () => {
    const res = await fetch(
      `/api/comments?entityId=${bookId}&commentType=book`
    );
    if (res.ok) {
      const data = await res.json();
      setComments(data.comments);
    }
  };

  return (
    <div className="mt-10 dark:text-white text-black">
      <h2 className="text-4xl font-bold mb-6 text-center">Comments</h2>

      {/* Comment Form */}
      {user ? (
        <div className="mb-6">
          <textarea
            className="w-full border rounded p-3 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Write a Comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows="3"
            required
          />
          <button
            onClick={handleCommentSubmit}
            className="mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            Submit
          </button>
        </div>
      ) : (
        <p className="text-gray-500 text-center mb-6">
          Please log in to Comment.{" "}
          <button className="bg-blue-800 text-white px-4 py-2 rounded">
            <SignInButton />
          </button>
        </p>
      )}

      {/* Comments List */}
      <ul className="space-y-6">
        {comments.map((comment) => {
          const likeNames = comment.likes
            .map((id) => userMap[id] || "Unknown")
            .filter(Boolean);

          return (
            <li key={comment._id} className="border-b pb-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="font-semibold italic text-gray-700 dark:text-gray-300">
                  {comment.username}
                </span>
                <span className="text-xs text-gray-500">
                  <TimeAgo date={comment.createdAt} />
                </span>
              </div>

              {editingCommentId === comment._id ? (
                <div className="mt-2">
                  <textarea
                    className="w-full border rounded p-3 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    rows="2"
                    required
                  />
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={(e) => handleEditSubmit(e, comment._id)}
                      className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingCommentId(null)}
                      className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-800 dark:text-gray-200">
                  {comment.content}
                </p>
              )}

              <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
                <div className="relative group">
                  <button
                    onClick={() => handleLike(comment._id)}
                    className="flex items-center text-blue-400 hover:text-blue-600 transition"
                  >
                    ❤️ {comment.likes.length || 0}
                  </button>
                  {likeNames.length > 0 && (
                    <div className="absolute left-1/2 transform -translate-x-1/2 mt-2 hidden group-hover:block bg-gray-900 bg-opacity-90 text-white text-xs rounded px-2 py-1 z-10 whitespace-nowrap">
                      {likeNames.map((name, index) => (
                        <div key={index}>{name}</div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={() =>
                    user
                      ? setReplyingTo(comment._id)
                      : alert("Please log in to reply.")
                  }
                  className="text-green-400 hover:text-green-600 transition"
                >
                  Reply
                </button>

                {user?.id === comment.userId && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleStartEdit(comment)}
                      className="text-blue-500 hover:text-blue-700 transition"
                    >
                      <AiFillEdit className="inline mr-1" /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(comment._id)}
                      className="text-red-500 hover:text-red-700 transition"
                    >
                      <BsTrash className="inline mr-1" /> Delete
                    </button>
                  </div>
                )}
              </div>

              {replyingTo === comment._id && (
                <div className="mt-4 ml-8 border-l-2 pl-4">
                  <textarea
                    className="w-full border rounded p-3 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Write a reply..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows="2"
                    required
                  />
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={(e) => handleReplySubmit(e, comment._id)}
                      className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition"
                    >
                      Reply
                    </button>
                    <button
                      onClick={() => setReplyingTo(null)}
                      className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {comment.replies && (
                <ul className="mt-4 space-y-4">
                  {comment.replies.map((reply) => {
                    const replyLikeNames = reply.likes
                      .map((id) => userMap[id] || "Unknown")
                      .filter(Boolean);

                    return (
                      <li key={reply._id} className="ml-8 border-l-2 pl-4">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-semibold text-gray-700 dark:text-gray-300">
                            {reply.username}
                          </span>
                          <span className="text-xs text-gray-500">
                            <TimeAgo date={reply.createdAt} />
                          </span>
                        </div>

                        {editingCommentId === reply._id ? (
                          <div className="mt-2">
                            <textarea
                              className="w-full border rounded p-3 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                              rows="2"
                              required
                            />
                            <div className="mt-2 flex gap-2">
                              <button
                                onClick={(e) => handleEditSubmit(e, reply._id)}
                                className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingCommentId(null)}
                                className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600 transition"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-gray-800 dark:text-gray-200">
                            {reply.content}
                          </p>
                        )}

                        <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
                          <div className="relative group">
                            <button
                              onClick={() => handleLike(reply._id)}
                              className="flex items-center text-blue-400 hover:text-blue-600 transition"
                            >
                              ❤️ {reply.likes.length || 0}
                            </button>
                            {replyLikeNames.length > 0 && (
                              <div className="absolute left-1/2 transform -translate-x-1/2 mt-2 hidden group-hover:block bg-gray-900 bg-opacity-90 text-white text-xs rounded px-2 py-1 z-10 whitespace-nowrap">
                                {replyLikeNames.map((name, index) => (
                                  <div key={index}>{name}</div>
                                ))}
                              </div>
                            )}
                          </div>

                          {user?.id === reply.userId && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleStartEdit(reply)}
                                className="text-blue-500 hover:text-blue-700 transition"
                              >
                                <AiFillEdit className="inline mr-1" /> Edit
                              </button>
                              <button
                                onClick={() => handleDelete(reply._id)}
                                className="text-red-500 hover:text-red-700 transition"
                              >
                                <BsTrash className="inline mr-1" /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
