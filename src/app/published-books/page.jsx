"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import AddBookForm from "../Components/AddBooks";
import { AiOutlineDelete, AiOutlineSearch } from "react-icons/ai";
import { HiOutlinePencil } from "react-icons/hi";
import CheckoutModal from "../Components/CheckoutModal";
import Loader from "../Components/Loader";

// Skeleton loader component
const BookSkeleton = () => (
  <div className="border rounded-lg shadow-lg p-4 animate-pulse">
    <div className="bg-gray-200 dark:bg-gray-700 h-64 w-full rounded-lg mb-4"></div>
    <div className="space-y-3">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
    </div>
  </div>
);

export const metadata = {
  title:
    "Islamic Books & Publications - At-Taleem || ইসলামী বই ও প্রকাশনী - আত-তালীম",
  description:
    "Browse our collection of Islamic books and publications. Find books on Quran, Hadith, Islamic history, and contemporary Islamic topics.",
  alternates: {
    canonical: "/published-books",
  },
  openGraph: {
    title:
      "Islamic Books & Publications - At-Taleem || ইসলামী বই ও প্রকাশনী - আত-তালীম",
    description:
      "Browse our collection of Islamic books and publications. Find books on Quran, Hadith, Islamic history, and contemporary Islamic topics.",
    url: "/published-books",
  },
  twitter: {
    title:
      "Islamic Books & Publications - At-Taleem || ইসলামী বই ও প্রকাশনী - আত-তালীম",
    description:
      "Browse our collection of Islamic books and publications. Find books on Quran, Hadith, Islamic history, and contemporary Islamic topics.",
  },
};

export default function PublishedBooksPage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [items, setItems] = useState([]);
  const [showCartModal, setShowCartModal] = useState(false);
  const [checkoutModal, setCheckoutModal] = useState(false);
  const [bundle, setBundle] = useState(false);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/books?page=${pagination.page}&limit=${pagination.limit}&search=${debouncedSearch}&category=${selectedCategory}`
      );
      if (res.ok) {
        const data = await res.json();
        setBooks(data.books);
        setPagination(data.pagination);
      }
    } catch (err) {
      console.error("Error fetching books:", err);
    } finally {
      setLoading(false);
    }
  };

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
    fetchBooks();
    fetchCategories();
  }, [pagination.page, debouncedSearch, selectedCategory]);

  useEffect(() => {
    if (!items.length > 0) setShowCartModal(false);
    if (items.length === books.length && items.every((item) => item.qty === 1))
      setBundle(true);
    else setBundle(false);
  }, [items]);

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
    <div className="max-w-7xl min-h-screen mx-auto p-4">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold">Books</h1>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search books..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pl-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
            />
            <AiOutlineSearch className="absolute left-3 top-3 text-gray-400" />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              setEditingBook(null);
              setShowModal(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            নতুন বই যুক্ত করুন
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <BookSkeleton key={i} />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {books.map((book) => {
              const inCart = items.some((b) => b.book._id === book._id);
              return (
                <div
                  key={book._id}
                  className="border rounded-lg shadow-lg p-4 hover:shadow-xl transition-shadow bg-white dark:bg-gray-800"
                >
                  <div className="relative aspect-[3/4] mb-4">
                    <Image
                      src={book.coverImage}
                      alt={book.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover rounded-lg"
                      priority={false}
                      loading="lazy"
                      quality={75}
                    />
                  </div>
                  <h2 className="text-xl font-semibold mb-2 line-clamp-2">
                    {book.title}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 mb-2">
                    {book.author}
                  </p>
                  <p className="text-green-600 font-bold mb-4">
                    BDT: {book.price} Taka Only
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {book.categories.map((cat) => (
                      <span
                        key={cat._id}
                        className="bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100 px-2 py-1 rounded-full text-xs"
                      >
                        {cat.name}
                      </span>
                    ))}
                  </div>
                  <div className="flex justify-between items-center">
                    <Link href={`/published-books/${book._id}`}>
                      <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                        বিস্তারিত দেখুন
                      </button>
                    </Link>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingBook(book);
                          setShowModal(true);
                        }}
                        className="text-blue-500 p-2 rounded hover:bg-blue-100 dark:hover:bg-blue-900"
                        title="Edit book"
                      >
                        <HiOutlinePencil size={20} />
                      </button>
                      <button
                        onClick={() => handleDeleteBook(book._id)}
                        className="text-red-500 p-2 rounded hover:bg-red-100 dark:hover:bg-red-900"
                        title="Delete book"
                      >
                        <AiOutlineDelete size={20} />
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => add(book)}
                    disabled={inCart}
                    className={`w-full mt-4 px-4 py-2 rounded-lg transition-colors ${
                      inCart
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-green-500 hover:bg-green-600 text-white"
                    }`}
                  >
                    {inCart ? "কার্টে আছে" : "কার্টে যুক্ত করুন"}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center mt-8 gap-2">
              <button
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    page: Math.max(1, prev.page - 1),
                  }))
                }
                disabled={pagination.page === 1}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-4 py-2">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    page: Math.min(pagination.totalPages, prev.page + 1),
                  }))
                }
                disabled={pagination.page === pagination.totalPages}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
      {items.length > 0 && (
        <>
          <div className="fixed top-20 right-4 bg-white text-gray-800 shadow p-3 rounded flex items-center gap-2 z-50">
            <button
              onClick={() => {
                setShowCartModal(true);
              }}
              title="Click to open"
            >
              🛒 ({items.length})<span> Total: {total} BDT</span>
            </button>
            <button
              className="relative text-red-600"
              onClick={clear}
              title="Clear Cart"
            >
              X
            </button>
          </div>
        </>
      )}

      {showCartModal && items.length > 0 && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setShowCartModal(false)}
          />

          {/* Modal */}
          <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl overflow-auto max-h-[90vh] w-full sm:w-3/4 lg:w-1/2">
            {/* Close Button */}
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-900 dark:hover:text-white"
              onClick={() => setShowCartModal(false)}
              aria-label="Close cart"
            >
              ✖
            </button>

            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Your Cart</h2>

              <table className="w-full table-auto mb-6">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-800">
                    <th className="p-2 text-left">Book</th>
                    <th className="p-2 text-center">Qty</th>
                    <th className="p-1 text-center"> Price </th>
                    <th className="p-2 text-center">Del</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(({ book, qty }) => (
                    <tr key={book._id} className="border-b justify-between">
                      {/* Cover + Title */}
                      <td className="p-2 flex items-center gap-2">
                        <img
                          src={book.coverImage}
                          alt={book.title}
                          className="w-12 h-16 object-cover rounded"
                        />
                        <span>{book.title}</span>
                      </td>

                      {/* Quantity Controls */}
                      <td className="p-2 text-center w-1/5">
                        <button
                          onClick={() => removeOne(book._id)}
                          className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded-l dark:hover:bg-gray-500 hover:bg-gray-300"
                        >
                          –
                        </button>
                        <span className="px-3">{qty}</span>
                        <button
                          onClick={() => increment(book)}
                          className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded-r hover:bg-gray-300 dark:hover:bg-gray-500"
                        >
                          +
                        </button>
                      </td>

                      {/* Line Price */}
                      <td className="p-1 text-center">
                        {book.price * qty} BDT
                      </td>

                      {/* Remove Button */}
                      <td className="p-2 text-center">
                        <button
                          onClick={() => removeAll(book._id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="flex justify-between items-center mt-4">
                <div className="text-left">
                  <p className="text-lg">
                    Complete Set Price:{" "}
                    <span className="font-semibold">
                      {specialPrice}
                      BDT
                    </span>
                  </p>
                  <button
                    disabled={bundle}
                    className={bundle ? "" : "bg-green-500 p-2 rounded"}
                    onClick={() => books.map((book) => add(book))}
                  >
                    {bundle ? "You're buying a set" : "Buy A Complete Set"}
                  </button>
                </div>
                <div className="text-right mb-6">
                  <p className="text-lg">
                    Subtotal:{" "}
                    <span className="font-semibold text-xl">
                      {bundle && total > specialPrice ? specialPrice : total}{" "}
                      BDT
                    </span>
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setShowCartModal(false)}
                  className="px-5 py-2 bg-gray-300 dark:bg-gray-700 rounded hover:bg-gray-400 dark:hover:bg-gray-800"
                >
                  Continue Shopping
                </button>
                <button
                  onClick={() => {
                    setShowCartModal(false);
                    setCheckoutModal(true);
                  }}
                  className="px-5 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Checkout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Book Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setShowModal(false)}
          ></div>
          <div className="relative p-5 max-h-svh overflow-auto sm:w-2/3 w-full lg:w-1/3 border rounded bg-white dark:bg-gray-900 shadow-sm">
            <button
              className="ml-auto absolute right-5 top-2 items-center rounded-lg bg-transparent p-1.5 text-sm text-gray-400 hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-gray-400 dark:hover:text-white"
              onClick={() => setShowModal(false)}
              title="Close"
            >
              <svg
                stroke="currentColor"
                fill="none"
                strokeWidth="2"
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                ></path>
              </svg>
            </button>
            <div className="mt-5">
              <AddBookForm
                initialBook={editingBook}
                onSuccess={bookSaveSuccess}
              />
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {checkoutModal && (
        <CheckoutModal
          open={checkoutModal}
          onClose={() => setCheckoutModal(false)}
          items={items}
          bundlePrice={bundle ? specialPrice : null}
        />
      )}
    </div>
  );
}
