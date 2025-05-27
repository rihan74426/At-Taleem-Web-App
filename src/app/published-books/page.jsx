"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import AddBookForm from "../Components/AddBooks";
import { AiOutlineDelete } from "react-icons/ai";
import { HiOutlinePencil } from "react-icons/hi";
import CheckoutModal from "../Components/CheckoutModal";
import Loader from "../Components/Loader";
import { useRouter, useSearchParams } from "next/navigation";
import BookCard from "../Components/BookCard";
import { BookGridSkeleton } from "../Components/BookSkeleton";
import { useUser } from "@clerk/nextjs";

export default function PublishedBooksPage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [items, setItems] = useState([]);
  const [showCartModal, setShowCartModal] = useState(false);
  const [checkoutModal, setCheckoutModal] = useState(false);
  const [bundle, setBundle] = useState(false);
  const [categories, setCategories] = useState([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser();

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/categories");
        if (res.ok) {
          const data = await res.json();
          setCategories(data.categories);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  // Fetch books with pagination and search
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setLoading(true);
        const queryParams = new URLSearchParams({
          page: pagination.page,
          limit: pagination.limit,
          search: debouncedSearch,
          ...(selectedCategory && { category: selectedCategory }),
        });

        const res = await fetch(`/api/books?${queryParams}`);
        if (res.ok) {
          const data = await res.json();
          setBooks(data.books);
          setPagination(data.pagination);
        }
      } catch (error) {
        console.error("Error fetching books:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, [pagination.page, pagination.limit, debouncedSearch, selectedCategory]);

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
    // Update URL with new page
    const params = new URLSearchParams(searchParams);
    params.set("page", newPage);
    router.push(`?${params.toString()}`);
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setPagination((prev) => ({ ...prev, page: 1 })); // Reset to first page on search
  };

  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId);
    setPagination((prev) => ({ ...prev, page: 1 })); // Reset to first page on category change
  };

  const handleDeleteBook = async (bookId) => {
    if (!confirm("Are you sure you want to delete this book?")) return;
    try {
      const res = await fetch(`/api/books/${bookId}`, {
        method: "DELETE",
      });
      if (res.ok) fetchBooks();
    } catch (err) {
      console.error("Error deleting book:", err);
    }
  };
  const bookSaveSuccess = (book) => {
    fetchBooks();
    setShowModal(false);
  };
  const add = (book) => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.book._id === book._id);
      if (idx === -1) {
        return [...prev, { book, qty: 1 }];
      } else {
        const next = [...prev];
        next.splice(idx, 1);
        return [...next, { book, qty: 1 }];
      }
    });
  };

  const increment = (book) => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.book._id === book._id);
      const next = [...prev];
      next[idx] = { book, qty: next[idx].qty + 1 };
      return next;
    });
  };
  // remove one or all
  const removeOne = (bookId) => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.book._id === bookId);
      if (idx === -1) return prev;
      const next = [...prev];
      if (next[idx].qty > 1) {
        next[idx] = { book: next[idx].book, qty: next[idx].qty - 1 };
      } else {
        if (confirm("Are you sure you want to remove the book from the cart?"))
          next.splice(idx, 1);
      }
      return next;
    });
  };

  // remove entire line
  const removeAll = (bookId) => {
    setItems((prev) => prev.filter((i) => i.book._id !== bookId));
  };
  const clear = () => setItems([]);

  const total = items.reduce((sum, b) => sum + b.qty * b.book.price, 0);
  const specialPrice = 1000;
  const savings = total - specialPrice;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header with Search and Filters */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Published Books
          </h1>
          {user?.publicMetadata?.isAdmin && (
            <button
              onClick={() => router.push("/dashboard?tab=books")}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add New Book
            </button>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search books..."
              value={searchQuery}
              onChange={handleSearch}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Books Grid */}
      {loading ? (
        <BookGridSkeleton />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {books.map((book) => (
              <BookCard key={book._id} book={book} />
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center mt-8 gap-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-4 py-2">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}

          {/* No Results */}
          {books.length === 0 && !loading && (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                No books found matching your criteria.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
