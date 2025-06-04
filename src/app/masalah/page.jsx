"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import {
  FaHeart,
  FaRegHeart,
  FaSearch,
  FaEdit,
  FaTrash,
  FaFilter,
  FaSort,
  FaBookmark,
  FaRegBookmark,
} from "react-icons/fa";
import MasalahForm from "../Components/MasalahForm";
import ResponseModal from "../Components/ResponseModal";

// Debounce function for search
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export default function MasalahPage() {
  const { user, isLoaded } = useUser();
  const [masalah, setMasalah] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [editingMasalah, setEditingMasalah] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [modal, setModal] = useState({
    isOpen: false,
    message: "",
    status: "",
  });
  const [bookmarkedMasalah, setBookmarkedMasalah] = useState(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [commentCounts, setCommentCounts] = useState({});
  const [error, setError] = useState(null);

  // Memoized user map
  const userMap = useMemo(() => {
    const map = {};
    users.forEach((u) => {
      map[u.id] = `${u.firstName} ${u.lastName}`;
    });
    return map;
  }, [users]);

  // Memoized query parameters
  const queryParams = useMemo(() => {
    return new URLSearchParams({
      page: pagination.page,
      limit: pagination.limit,
      search,
      sortBy,
      sortOrder,
      ...(selectedCategory && { category: selectedCategory }),
    });
  }, [
    pagination.page,
    pagination.limit,
    search,
    sortBy,
    sortOrder,
    selectedCategory,
  ]);

  // Memoized fetch functions
  const fetchMasalah = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/masalah?${queryParams}`);
      if (!res.ok) {
        throw new Error("Failed to fetch issues");
      }
      const data = await res.json();
      setMasalah(data.masalah);
      setPagination(data.pagination);
    } catch (err) {
      console.error("Error fetching masalah:", err);
      setError(err.message);
      setModal({
        isOpen: true,
        message: "Error loading issues. Please try again later.",
        status: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [queryParams]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/categories");
      if (!res.ok) {
        throw new Error("Failed to fetch categories");
      }
      const data = await res.json();
      setCategories(data.categories);
    } catch (err) {
      console.error("Error fetching categories:", err);
      setModal({
        isOpen: true,
        message: "Error loading categories",
        status: "error",
      });
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/user", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        throw new Error("Failed to fetch users");
      }
      const data = await res.json();
      setUsers(data.users.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  }, []);

  const fetchCommentCounts = useCallback(async () => {
    try {
      const masalahIds = masalah.map((item) => item._id);
      if (masalahIds.length === 0) return;

      const promises = masalahIds.map((id) =>
        fetch(`/api/comments?entityId=${id}&commentType=masalah`)
          .then((res) => res.json())
          .then((data) => ({ id, count: data.comments.length }))
      );

      const results = await Promise.all(promises);
      const counts = {};
      results.forEach(({ id, count }) => {
        counts[id] = count;
      });
      setCommentCounts(counts);
    } catch (err) {
      console.error("Error fetching comment counts:", err);
    }
  }, [masalah]);

  // Memoized handlers
  const handleLike = useCallback(
    async (masalahId) => {
      if (!user || isSubmitting) {
        if (!user) {
          setModal({
            isOpen: true,
            message: "Please sign in to like issues",
            status: "error",
          });
        }
        return;
      }

      setIsSubmitting(true);
      try {
        const res = await fetch(`/api/masalah/${masalahId}`, {
          method: "PATCH",
        });

        if (!res.ok) {
          throw new Error("Failed to update like status");
        }

        const currentItem = masalah.find((item) => item._id === masalahId);
        const isCurrentlyLiked = currentItem?.likers.includes(user.id);

        setMasalah((prevMasalah) =>
          prevMasalah.map((item) => {
            if (item._id === masalahId) {
              const updatedLikers = isCurrentlyLiked
                ? item.likers.filter((id) => id !== user.id)
                : [...item.likers, user.id];

              return {
                ...item,
                likers: updatedLikers,
              };
            }
            return item;
          })
        );

        setModal({
          isOpen: true,
          message: `Issue ${
            isCurrentlyLiked ? "unliked" : "liked"
          } successfully`,
          status: "success",
        });
      } catch (err) {
        console.error("Error toggling like:", err);
        setModal({
          isOpen: true,
          message: "Failed to update like status",
          status: "error",
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [user, isSubmitting, masalah]
  );

  const handleBookmark = useCallback(
    (masalahId) => {
      if (!user) {
        setModal({
          isOpen: true,
          message: "Please sign in to bookmark issues",
          status: "error",
        });
        return;
      }

      setBookmarkedMasalah((prev) => {
        const newSet = new Set(prev);
        const isBookmarked = newSet.has(masalahId);
        if (isBookmarked) {
          newSet.delete(masalahId);
        } else {
          newSet.add(masalahId);
        }

        setModal({
          isOpen: true,
          message: `Issue ${
            isBookmarked ? "removed from" : "added to"
          } bookmarks`,
          status: "success",
        });

        return newSet;
      });
    },
    [user]
  );

  const handleEdit = useCallback((masalah) => {
    setEditingMasalah(masalah);
    setShowEditModal(true);
  }, []);

  const handleDelete = useCallback(
    async (masalahId) => {
      if (!user?.publicMetadata?.isAdmin || isSubmitting) {
        if (!user?.publicMetadata?.isAdmin) {
          setModal({
            isOpen: true,
            message: "You don't have permission to delete issues",
            status: "error",
          });
        }
        return;
      }

      if (!window.confirm("Are you sure you want to delete this issue?"))
        return;

      setIsSubmitting(true);
      try {
        const res = await fetch(`/api/masalah/${masalahId}`, {
          method: "DELETE",
        });

        if (!res.ok) {
          throw new Error("Failed to delete issue");
        }

        setMasalah((prevMasalah) =>
          prevMasalah.filter((item) => item._id !== masalahId)
        );
        setModal({
          isOpen: true,
          message: "Issue deleted successfully",
          status: "success",
        });
      } catch (err) {
        console.error("Error deleting issue:", err);
        setModal({
          isOpen: true,
          message: "Failed to delete issue",
          status: "error",
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [user, isSubmitting]
  );

  const handleEditSubmit = useCallback(
    async (data) => {
      if (isSubmitting) return;
      setIsSubmitting(true);

      try {
        const res = await fetch(`/api/masalah/${editingMasalah._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (!res.ok) {
          throw new Error("Failed to update issue");
        }

        const updatedMasalah = await res.json();
        setMasalah((prevMasalah) =>
          prevMasalah.map((item) =>
            item._id === editingMasalah._id ? updatedMasalah : item
          )
        );
        setModal({
          isOpen: true,
          message: "Issue updated successfully",
          status: "success",
        });
        setShowEditModal(false);
      } catch (err) {
        console.error("Error updating issue:", err);
        setModal({
          isOpen: true,
          message: "Failed to update issue",
          status: "error",
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [editingMasalah, isSubmitting]
  );

  const handleResetFilters = useCallback(() => {
    setSearch("");
    setSelectedCategory("");
    setSortBy("createdAt");
    setSortOrder("desc");
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  // Debounced search handler
  const debouncedSearch = useMemo(
    () =>
      debounce((value) => {
        setSearch(value);
        setPagination((prev) => ({ ...prev, page: 1 }));
      }, 500),
    []
  );

  // Effects
  useEffect(() => {
    if (isLoaded) {
      fetchMasalah();
    }
  }, [isLoaded, fetchMasalah]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (masalah.length > 0) {
      fetchCommentCounts();
    }
  }, [masalah, fetchCommentCounts]);

  // Load bookmarked masalah from localStorage
  useEffect(() => {
    const savedBookmarks = localStorage.getItem("bookmarkedMasalah");
    if (savedBookmarks) {
      try {
        setBookmarkedMasalah(new Set(JSON.parse(savedBookmarks)));
      } catch (err) {
        console.error("Error loading bookmarks:", err);
        localStorage.removeItem("bookmarkedMasalah");
      }
    }
  }, []);

  // Save bookmarked masalah to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        "bookmarkedMasalah",
        JSON.stringify([...bookmarkedMasalah])
      );
    } catch (err) {
      console.error("Error saving bookmarks:", err);
    }
  }, [bookmarkedMasalah]);

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 dark:text-red-400">
            Error Loading Issues
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            আমাদের গবেষণালব্ধ কিছু গুরুত্বপূর্ণ মাসআলা
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            আমাদের দৈনন্দিন জীবনের সাথে জড়িত ও সামাজিক প্রেক্ষাপটে প্রচারিত
            মাসআলা-মাসায়েল
          </p>
        </div>
        {user?.publicMetadata?.isAdmin && (
          <Link
            href="/masalah/input"
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <span>নতুন মাসআলা যুক্ত করুন</span>
          </Link>
        )}
      </div>

      {/* Search and Filter Section */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex-1 relative w-full">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="মাসআলা খুঁজুন..."
              className="w-full pl-10 pr-4 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 border rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Toggle filters"
            >
              <FaFilter />
            </button>
            {(search ||
              selectedCategory ||
              sortBy !== "createdAt" ||
              sortOrder !== "desc") && (
              <button
                onClick={handleResetFilters}
                className="p-2 border rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm"
                title="Reset filters"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Expanded Filters */}
        <div
          className={`grid gap-4 transition-all duration-300 ${
            showFilters
              ? "grid-rows-[1fr] opacity-100"
              : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="overflow-hidden">
            <div className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="flex-1 px-4 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">ক্যাটাগরি</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [newSortBy, newSortOrder] = e.target.value.split("-");
                  setSortBy(newSortBy);
                  setSortOrder(newSortOrder);
                }}
                className="flex-1 px-4 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="createdAt-desc">নতুন সবার আগে</option>
                <option value="createdAt-asc">পুরাতন সবার আগে</option>
                <option value="likeCount-desc">বেশি পছন্দ করা হয়েছে</option>
                <option value="commentCount-desc">বেশি কমেন্ট করা হয়েছে</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Masalah List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            মাসআলা লোড হচ্ছে...
          </p>
        </div>
      ) : masalah.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            কোন মাসআলা পাওয়া যায় নি। ফিল্টার পরিবর্তন করে দেখুন!
          </p>
          {(search || selectedCategory) && (
            <button
              onClick={handleResetFilters}
              className="mt-4 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {masalah.map((item) => (
            <div
              key={item._id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/masalah/${item._id}`}
                      className="text-xl font-semibold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    >
                      {item.title}
                    </Link>
                    {user?.publicMetadata?.isAdmin && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-gray-500 hover:text-blue-500 transition-colors"
                          title="Edit"
                          disabled={isSubmitting}
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(item._id)}
                          className="text-gray-500 hover:text-red-500 transition-colors"
                          title="Delete"
                          disabled={isSubmitting}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    )}
                  </div>
                  <Link
                    href={`/masalah/${item._id}`}
                    title="দলীল দেখতে ভেতরে আসুন"
                  >
                    <p className="mt-2 text-gray-600 dark:text-gray-300 line-clamp-2">
                      {item.description}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {item.categories.map((cat) => (
                        <span
                          key={cat._id}
                          className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium"
                        >
                          {cat.name}
                        </span>
                      ))}
                    </div>
                  </Link>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="relative group">
                    <button
                      onClick={() => handleLike(item._id)}
                      className="flex items-center gap-2 text-gray-500 hover:text-red-500 transition-colors disabled:opacity-50"
                      disabled={!user || isSubmitting}
                      title={!user ? "Sign in to like" : ""}
                    >
                      {item.likers.includes(user?.id) ? (
                        <FaHeart className="text-red-500" />
                      ) : (
                        <FaRegHeart />
                      )}
                      <span>{item.likers.length}</span>
                    </button>
                    {item.likers.length > 0 && (
                      <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-md shadow-lg p-2 hidden group-hover:block z-10">
                        <p className="text-sm font-semibold mb-1">
                          পছন্দ করেছেন:
                        </p>
                        <div className="max-h-32 overflow-y-auto">
                          {item.likers.map((likerId) => {
                            const likeNames = userMap[likerId] || "Unknown";
                            return (
                              <div
                                key={likerId}
                                className="flex items-center gap-2 py-1"
                              >
                                <span className="text-sm text-gray-600 dark:text-gray-300">
                                  {likerId === user?.id ? "আপনি" : likeNames}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleBookmark(item._id)}
                    className="text-gray-500 hover:text-yellow-500 transition-colors disabled:opacity-50"
                    disabled={!user}
                    title={!user ? "Sign in to bookmark" : ""}
                  >
                    {bookmarkedMasalah.has(item._id) ? (
                      <FaBookmark className="text-yellow-500" />
                    ) : (
                      <FaRegBookmark />
                    )}
                  </button>
                </div>
              </div>
              <Link
                href={`/masalah/${item._id}`}
                title="দলীল দেখতে ভেতরে আসুন"
                className="mt-4 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400"
              >
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    {commentCounts[item._id] || 0} comments
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p
                  href={`/masalah/${item._id}`}
                  className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium"
                >
                  বিস্তারিত দেখুন →
                </p>
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          <button
            onClick={() =>
              setPagination((prev) => ({
                ...prev,
                page: Math.max(1, prev.page - 1),
              }))
            }
            disabled={pagination.page === 1 || loading}
            className="px-4 py-2 border rounded-md disabled:opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-gray-600 dark:text-gray-300">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            onClick={() =>
              setPagination((prev) => ({
                ...prev,
                page: Math.min(pagination.totalPages, prev.page + 1),
              }))
            }
            disabled={pagination.page === pagination.totalPages || loading}
            className="px-4 py-2 border rounded-md disabled:opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            Next
          </button>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingMasalah && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Edit Issue</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                disabled={isSubmitting}
              >
                ×
              </button>
            </div>
            <MasalahForm
              initialData={editingMasalah}
              onSubmit={handleEditSubmit}
              isAdmin={user?.publicMetadata?.isAdmin}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      )}

      {/* Response Modal */}
      <ResponseModal
        isOpen={modal.isOpen}
        message={modal.message}
        status={modal.status}
        onClose={() => setModal((m) => ({ ...m, isOpen: false }))}
      />
    </div>
  );
}
