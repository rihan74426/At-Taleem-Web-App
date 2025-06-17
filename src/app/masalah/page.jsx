"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
  FaTimes,
} from "react-icons/fa";
import MasalahForm from "../Components/MasalahForm";
import ResponseModal from "../Components/ResponseModal";
import MasalahSkeleton from "../Components/MasalahSkeleton";

// Constants
const ITEMS_PER_PAGE = 10;
const DEBOUNCE_DELAY = 300;

// Custom debounce hook
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export default function MasalahPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoaded } = useUser();
  const searchInputRef = useRef(null);

  // State management
  const [masalah, setMasalah] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState({
    isOpen: false,
    message: "",
    status: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMasalah, setEditingMasalah] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [bookmarkedMasalah, setBookmarkedMasalah] = useState(new Set());

  // Local filter states (not synced with URL immediately)
  const [localFilters, setLocalFilters] = useState({
    search: searchParams.get("search") || "",
    category: searchParams.get("category") || "",
    sortBy: searchParams.get("sortBy") || "createdAt",
    sortOrder: searchParams.get("sortOrder") || "desc",
    page: parseInt(searchParams.get("page")) || 1,
  });

  // Debounced search value
  const debouncedSearch = useDebounce(localFilters.search, DEBOUNCE_DELAY);

  // Pagination state
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
  });

  // Memoized user map
  const userMap = useMemo(() => {
    const map = {};
    users.forEach((u) => {
      map[u.id] = `${u.firstName} ${u.lastName}`;
    });
    return map;
  }, [users]);

  // Memoized query parameters (using debounced search)
  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    const effectiveFilters = {
      ...localFilters,
      search: debouncedSearch, // Use debounced search value
    };

    Object.entries(effectiveFilters).forEach(([key, value]) => {
      if (value && value !== "") params.append(key, value);
    });
    params.append("limit", ITEMS_PER_PAGE);
    return params.toString();
  }, [localFilters, debouncedSearch]);

  // Update URL only when debounced search changes or other filters change
  useEffect(() => {
    const effectiveFilters = {
      ...localFilters,
      search: debouncedSearch,
    };

    const url = new URL(window.location.href);
    let hasChanges = false;

    Object.entries(effectiveFilters).forEach(([key, value]) => {
      const currentValue = url.searchParams.get(key);
      if (value && value !== "") {
        if (currentValue !== value) {
          url.searchParams.set(key, value);
          hasChanges = true;
        }
      } else {
        if (currentValue !== null) {
          url.searchParams.delete(key);
          hasChanges = true;
        }
      }
    });
  }, [
    debouncedSearch,
    localFilters.category,
    localFilters.sortBy,
    localFilters.sortOrder,
    localFilters.page,
    router,
  ]);

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [masalahRes, categoriesRes, usersRes] = await Promise.all([
        fetch(`/api/masalah?${queryParams}`),
        fetch("/api/categories"),
        fetch("/api/user"),
      ]);

      if (!masalahRes.ok || !categoriesRes.ok || !usersRes.ok) {
        throw new Error("Failed to fetch data");
      }

      const [masalahData, categoriesData, usersData] = await Promise.all([
        masalahRes.json(),
        categoriesRes.json(),
        usersRes.json(),
      ]);

      // Update states
      setMasalah(masalahData.masalah);
      setPagination({
        total: masalahData.pagination.total,
        totalPages: masalahData.pagination.totalPages,
      });
      setCategories(categoriesData.categories);
      setUsers(usersData.users.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("ডাটা লোড করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
      setModal({
        isOpen: true,
        message: "ডাটা লোড করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।",
        status: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [queryParams]);

  // Load initial data
  useEffect(() => {
    if (isLoaded) {
      fetchData();
    }
  }, [isLoaded, fetchData]);

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

  // Handlers
  const handleFilterChange = useCallback((key, value) => {
    setLocalFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page on filter change
    }));
  }, []);

  const handleSearchChange = useCallback((value) => {
    setLocalFilters((prev) => ({
      ...prev,
      search: value,
      page: 1, // Reset to first page on search
    }));
  }, []);

  const handleResetFilters = useCallback(() => {
    setLocalFilters({
      search: "",
      category: "",
      sortBy: "createdAt",
      sortOrder: "desc",
      page: 1,
    });
    // Focus search input after reset
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  const handleLike = useCallback(
    async (masalahId) => {
      if (!user || isSubmitting) {
        if (!user) {
          setModal({
            isOpen: true,
            message: "মাসআলা পছন্দ করতে লগইন করুন",
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

        if (!res.ok) throw new Error("Failed to update like status");

        const currentItem = masalah.find((item) => item._id === masalahId);
        const isCurrentlyLiked = currentItem?.likers.includes(user.id);

        setMasalah((prevMasalah) =>
          prevMasalah.map((item) => {
            if (item._id === masalahId) {
              return {
                ...item,
                likers: isCurrentlyLiked
                  ? item.likers.filter((id) => id !== user.id)
                  : [...item.likers, user.id],
              };
            }
            return item;
          })
        );

        setModal({
          isOpen: true,
          message: `মাসআলা ${
            isCurrentlyLiked ? "অপছন্দ করা হয়েছে" : "পছন্দ করা হয়েছে"
          }`,
          status: "success",
        });
      } catch (err) {
        console.error("Error toggling like:", err);
        setModal({
          isOpen: true,
          message: "মাসআলা পছন্দ করা ব্যর্থ হয়েছে",
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
          message: "মাসআলা বুকমার্ক করতে লগইন করুন",
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
          message: `মাসআলা ${
            isBookmarked ? "বুকমার্ক থেকে সরানো হয়েছে" : "বুকমার্ক করা হয়েছে"
          }`,
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
            message: "আপনার মাসআলা ডিলিট করার পারমিশন নাই",
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

        if (!res.ok) throw new Error("Failed to delete issue");

        setMasalah((prevMasalah) =>
          prevMasalah.filter((item) => item._id !== masalahId)
        );

        setModal({
          isOpen: true,
          message: "মাসআলা ডিলিট সফল হয়েছে!",
          status: "success",
        });
      } catch (err) {
        console.error("Error deleting issue:", err);
        setModal({
          isOpen: true,
          message: "মাসআলা ডিলিট ব্যর্থ হয়েছে!",
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

        if (!res.ok) throw new Error("Failed to update issue");

        await res.json();
        fetchData();

        setModal({
          isOpen: true,
          message: "মাসআলা আপডেট সফল হয়েছে",
          status: "success",
        });
        setShowEditModal(false);
      } catch (err) {
        console.error("Error updating issue:", err);
        setModal({
          isOpen: true,
          message: "মাসআলা আপডেট ব্যর্থ হয়েছে",
          status: "error",
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [editingMasalah, isSubmitting, fetchData]
  );

  // Render loading state
  if (loading && !masalah.length) {
    return (
      <div className="container mx-auto px-4 py-8 min-h-screen">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 animate-pulse"></div>
          </div>
        </div>

        {/* Search and Filter Section Skeleton */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex-1">
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
            <div className="flex gap-2">
              <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
          </div>
        </div>

        <MasalahSkeleton />
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 dark:text-red-400">
            মাসআলা লোড করতে সমস্যা হয়েছে
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition"
          >
            আবার চেষ্টা করুন
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
            আমাদের দৈনন্দিন জীবনের সাথে জড়িত ও সামাজিক প্রেক্ষাপটে প্রচারিত
            মাসআলা-মাসায়েল
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
              ref={searchInputRef}
              type="text"
              value={localFilters.search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="মাসআলা খুঁজুন..."
              className="w-full pl-10 pr-10 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
            {localFilters.search && (
              <button
                onClick={() => handleSearchChange("")}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <FaTimes size={14} />
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 border rounded-md transition-colors ${
                showFilters
                  ? "bg-indigo-100 dark:bg-indigo-900 border-indigo-300 dark:border-indigo-700"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
              title="Toggle filters"
            >
              <FaFilter />
            </button>
            {(localFilters.search ||
              localFilters.category ||
              localFilters.sortBy !== "createdAt" ||
              localFilters.sortOrder !== "desc") && (
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
                value={localFilters.category}
                onChange={(e) => handleFilterChange("category", e.target.value)}
                className="flex-1 px-4 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">সকল ক্যাটাগরি</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <select
                value={`${localFilters.sortBy}-${localFilters.sortOrder}`}
                onChange={(e) => {
                  const [newSortBy, newSortOrder] = e.target.value.split("-");
                  handleFilterChange("sortBy", newSortBy);
                  handleFilterChange("sortOrder", newSortOrder);
                }}
                className="flex-1 px-4 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="createdAt-desc">নতুন সবার আগে</option>
                <option value="createdAt-asc">পুরাতন সবার আগে</option>
                <option value="likeCount-desc">বেশি পছন্দ করা হয়েছে</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      {!loading && (
        <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          {pagination.total > 0 ? (
            <span>
              {pagination.total} টি মাসআলা পাওয়া গেছে
              {(localFilters.search || localFilters.category) && (
                <span className="ml-2">
                  (ফিল্টার: {localFilters.search && `"${localFilters.search}"`}
                  {localFilters.search && localFilters.category && " এবং "}
                  {localFilters.category &&
                    categories.find((c) => c._id === localFilters.category)
                      ?.name}
                  )
                </span>
              )}
            </span>
          ) : (
            <span>কোন মাসআলা পাওয়া যায় নি</span>
          )}
        </div>
      )}

      {/* Masalah List */}
      {masalah.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            কোন মাসআলা পাওয়া যায় নি। ফিল্টার পরিবর্তন করে দেখুন!
          </p>
          {(localFilters.search || localFilters.category) && (
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
                title="বিস্তারিত দলীল দেখতে ভেতরে আসুন"
                className="mt-4 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400"
              >
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium">
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
            onClick={() => handleFilterChange("page", localFilters.page - 1)}
            disabled={localFilters.page === 1 || loading}
            className="px-4 py-2 border rounded-md disabled:opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-gray-600 dark:text-gray-300">
            Page {localFilters.page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => handleFilterChange("page", localFilters.page + 1)}
            disabled={localFilters.page === pagination.totalPages || loading}
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
              onClose={() => setEditingMasalah(false)}
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
