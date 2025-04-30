"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import AddBookForm from "../Components/AddBooks";
import { AiOutlineDelete } from "react-icons/ai";
import { HiOutlinePencil } from "react-icons/hi";
import CheckoutModal from "../Components/CheckoutModal";
import Loader from "../Components/Loader";

export default function BookListingPage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [items, setItems] = useState([]);
  const [showCartModal, setShowCartModal] = useState(false);
  const [checkoutModal, setCheckoutModal] = useState(false);
  const [bundle, setBundle] = useState(false);

  const [categories, setCategories] = useState([]);

  const fetchBooks = async () => {
    try {
      const res = await fetch("/api/books");
      if (res.ok) {
        const data = await res.json();
        setBooks(data.books);
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
  }, []);
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
    <div className="max-w-6xl min-h-screen mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Books</h1>
      <button
        onClick={() => {
          setEditingBook(null);
          setShowModal(true);
        }}
        className="ml-2 mb-2 flex justify-self-center px-4 py-2 border rounded-3xl hover:bg-blue-200 dark:hover:bg-blue-900 dark:bg-gray-800"
      >
        নতুন বই যুক্ত করুন
      </button>

      {loading ? (
        <div className="flex items-center place-content-center min-h-screen">
          <Loader />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {books.map((book) => {
            const inCart = items.some((b) => b.book._id === book._id);
            return (
              <div
                key={book._id}
                className="border rounded shadow p-4 flex flex-col justify-between"
              >
                <Image
                  src={book.coverImage}
                  alt={book.title}
                  width={500}
                  height={700}
                  className="object-cover"
                />
                <h2 className="mt-2 text-xl font-semibold">{book.title}</h2>
                <div className="grid grid-cols-4 gap-4">
                  <div className="col-span-3">
                    <p className="text-gray-600">{book.author}</p>
                    <p className="text-green-600 font-bold">
                      BDT: {book.price} Taka Only
                    </p>
                  </div>
                  <div className="flex gap-2 w-full justify-center sm:justify-end">
                    <button
                      onClick={() => {
                        setEditingBook(book);
                        setShowModal(true);
                      }}
                      className="text-blue-500 p-2 rounded hover:bg-slate-300 dark:hover:bg-slate-800"
                      title="Edit book"
                    >
                      <HiOutlinePencil size={20} />
                    </button>
                    <button
                      onClick={() => handleDeleteBook(book._id)}
                      className="text-red-500 p-2 rounded hover:bg-slate-300 dark:hover:bg-slate-800"
                      title="Delete book"
                    >
                      <AiOutlineDelete size={20} />
                    </button>
                  </div>
                </div>
                <div className="mt-2">
                  <div className="flex flex-wrap items-center">
                    {categories
                      .filter((cat) => book.categories.includes(cat._id))
                      .map((cat) => (
                        <span
                          key={cat._id}
                          className="m-1 bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100 px-3 py-1 rounded-lg text-sm"
                        >
                          {cat.name}
                        </span>
                      ))}
                  </div>
                </div>

                <div className="justify-between items-center">
                  <Link href={`/published-books/${book._id}`}>
                    <button className="m-2 inline-block bg-blue-500 text-white px-4 py-2 rounded">
                      বিস্তারিত দেখুন
                    </button>
                  </Link>
                  <button
                    onClick={() => add(book)}
                    disabled={inCart}
                    className={`m-2 px-4 py-2 rounded ${
                      inCart ? "bg-gray-400" : "bg-green-500 text-white"
                    }`}
                  >
                    {inCart ? "কার্টে আছে" : "কার্টে যুক্ত করুন"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {!books.length > 0 && (
        <p className="min-h-screen text-center">এখনো কোন বই প্রকাশিত হয় নি!</p>
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

      <CheckoutModal
        open={checkoutModal}
        onClose={() => setCheckoutModal(false)}
        items={items}
        bundlePrice={bundle && total > specialPrice ? specialPrice : null}
      />
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className="bg-black/80 absolute inset-0"
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
    </div>
  );
}
