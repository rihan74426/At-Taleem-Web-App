"use client";

import { useState, useEffect } from "react";
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

export default function MasalahPage() {
  const { user, isLoaded } = useUser();
  const [masalah, setMasalah] = useState([]);
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

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== "") {
        fetchMasalah();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/categories");
        if (res.ok) {
          const data = await res.json();
          setCategories(data.categories);
        } else {
          const errorData = await res.json();
          setModal({
            isOpen: true,
            message: errorData.error || "Failed to fetch categories",
            status: "error",
          });
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
        setModal({
          isOpen: true,
          message: "Network error while fetching categories",
          status: "error",
        });
      }
    };
    fetchCategories();
  }, []);

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

  // Fetch masalah with current filters
  const fetchMasalah = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        search,
        sortBy,
        sortOrder,
        ...(selectedCategory && { category: selectedCategory }),
      });

      const res = await fetch(`/api/masalah?${queryParams}`);
      if (res.ok) {
        const data = await res.json();
        setMasalah(data.masalah);
        setPagination(data.pagination);
      } else {
        const errorData = await res.json();
        setModal({
          isOpen: true,
          message: errorData.error || "Failed to fetch issues",
          status: "error",
        });
      }
    } catch (err) {
      console.error("Error fetching masalah:", err);
      setModal({
        isOpen: true,
        message: "Network error while fetching issues",
        status: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded) {
      fetchMasalah();
    }
  }, [isLoaded, pagination.page, selectedCategory, sortBy, sortOrder]);

  // Handle like toggle
  const handleLike = async (masalahId) => {
    if (!user) {
      setModal({
        isOpen: true,
        message: "Please sign in to like issues",
        status: "error",
      });
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/masalah/${masalahId}/like`, {
        method: "POST",
      });

      if (res.ok) {
        // Find the current item to check its like status
        const currentItem = masalah.find((item) => item._id === masalahId);
        const isCurrentlyLiked = currentItem?.likers.includes(user.id);

        // Update the state directly based on the current state
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

        // Show success message with the correct status
        setModal({
          isOpen: true,
          message: `Issue ${
            isCurrentlyLiked ? "unliked" : "liked"
          } successfully`,
          status: "success",
        });
      } else {
        const errorData = await res.json();
        setModal({
          isOpen: true,
          message: errorData.error || "Failed to update like status",
          status: "error",
        });
      }
    } catch (err) {
      console.error("Error toggling like:", err);
      setModal({
        isOpen: true,
        message: "Network error while updating like status",
        status: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle bookmark toggle
  const handleBookmark = (masalahId) => {
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
  };

  // Handle edit
  const handleEdit = (masalah) => {
    setEditingMasalah(masalah);
    setShowEditModal(true);
  };

  // Handle delete
  const handleDelete = async (masalahId) => {
    if (!user?.publicMetadata?.isAdmin) {
      setModal({
        isOpen: true,
        message: "You don't have permission to delete issues",
        status: "error",
      });
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    if (window.confirm("Are you sure you want to delete this issue?")) {
      try {
        const res = await fetch(`/api/masalah/${masalahId}`, {
          method: "DELETE",
        });
        if (res.ok) {
          setMasalah((prevMasalah) =>
            prevMasalah.filter((item) => item._id !== masalahId)
          );
          setModal({
            isOpen: true,
            message: "Issue deleted successfully",
            status: "success",
          });
        } else {
          const errorData = await res.json();
          setModal({
            isOpen: true,
            message: errorData.error || "Failed to delete issue",
            status: "error",
          });
        }
      } catch (err) {
        setModal({
          isOpen: true,
          message: "Network error while deleting issue",
          status: "error",
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Handle form submission for editing
  const handleEditSubmit = async (data) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/masalah/${editingMasalah._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
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
      } else {
        const errorData = await res.json();
        setModal({
          isOpen: true,
          message: errorData.error || "Failed to update issue",
          status: "error",
        });
      }
    } catch (err) {
      setModal({
        isOpen: true,
        message: "Network error while updating issue",
        status: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle filter reset
  const handleResetFilters = () => {
    setSearch("");
    setSelectedCategory("");
    setSortBy("createdAt");
    setSortOrder("desc");
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Islamic Issues (Masalah)
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Explore and discuss Islamic issues with the community
          </p>
        </div>
        {user?.publicMetadata?.isAdmin && (
          <Link
            href="/masalah/input"
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <span>Add New Issue</span>
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
              placeholder="Search issues..."
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
                <option value="">All Categories</option>
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
                <option value="createdAt-desc">Newest First</option>
                <option value="createdAt-asc">Oldest First</option>
                <option value="likeCount-desc">Most Liked</option>
                <option value="commentCount-desc">Most Commented</option>
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
            Loading issues...
          </p>
        </div>
      ) : masalah.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            No issues found. Try adjusting your search or filters.
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
                        <p className="text-sm font-semibold mb-1">Liked by:</p>
                        <div className="max-h-32 overflow-y-auto">
                          {item.likers.map((likerId) => (
                            <div
                              key={likerId}
                              className="flex items-center gap-2 py-1"
                            >
                              <span className="text-sm text-gray-600 dark:text-gray-300">
                                {likerId === user?.id ? "You" : likerId}
                              </span>
                            </div>
                          ))}
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
              <div className="mt-4 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    {item.comments.length} comments
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <Link
                  href={`/masalah/${item._id}`}
                  className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium"
                >
                  Read more →
                </Link>
              </div>
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
