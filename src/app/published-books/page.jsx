"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import AddBookForm from "../Components/AddBooks";
import { AiOutlineDelete } from "react-icons/ai";
import { HiOutlinePencil } from "react-icons/hi";

export default function BookListingPage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [items, setItems] = useState([]);
  const [showCartModal, setShowCartModal] = useState(false);

  const fetchBooks = async () => {
    try {
      const res = await fetch("/api/books");
      if (res.ok) {
        const data = await res.json();
        setBooks(data.books);
        console.log(books);
      }
    } catch (err) {
      console.error("Error fetching books:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

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
    if (!items.find((b) => b._id === book._id)) {
      setItems([...items, book]);
    }
  };
  const remove = (bookId) => {
    setItems(items.filter((b) => b._id !== bookId));
  };
  const clear = () => setItems([]);

  const total = items.reduce((sum, b) => sum + b.price, 0);
  const specialPrice = 1000;
  const savings = total - specialPrice;

  if (loading)
    return (
      <p className="min-h-screen place-content-center flex items-center">
        Loading...
      </p>
    );
  if (!books.length > 0)
    return <p className="min-h-screen text-center">No Books Published Yet!</p>;

  return (
    <div className="max-w-6xl min-h-screen mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Books</h1>
      <button
        onClick={() => {
          setEditingBook(null);
          setShowModal(true);
        }}
        className="ml-2 flex justify-self-center px-4 py-2 border rounded-3xl hover:bg-blue-200 dark:hover:bg-blue-900 dark:bg-gray-800"
      >
        Add New Book
      </button>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {books.map((book) => {
          const inCart = items.some((b) => b._id === book._id);

          <div key={book._id} className="border rounded shadow p-4">
            <Image
              src={book.coverImage}
              alt={book.title}
              width={500}
              height={700}
              className="object-cover"
            />
            <h2 className="mt-2 text-xl font-semibold">{book.title}</h2>
            <p className="text-gray-600">{book.author}</p>
            <p className="text-green-600 font-bold">
              BDT: {book.price} Taka Only
            </p>
            <div>
              <Link href={`/published-books/${book._id}`}>
                <button className="mt-2 inline-block bg-blue-500 text-white px-4 py-2 rounded">
                  View Details
                </button>
              </Link>
              <div>
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
              <button
                onClick={() => add(book)}
                disabled={inCart}
                className={`mt-2 px-4 py-2 rounded ${
                  inCart ? "bg-gray-400" : "bg-green-500"
                }`}
              >
                {inCart ? "In Cart" : "Add to Cart"}
              </button>
            </div>
          </div>;
        })}
      </div>
      {items.length > 0 && (
        <>
          <button className="relative" onClick={() => setShowCartModal(true)}>
            🛒
            <span className="absolute -top-1 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
              {items.length}
            </span>
          </button>
          <button className="relative" onClick={clear}>
            Clear
          </button>
        </>
      )}

      {showCartModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className="bg-black/80 absolute inset-0"
            onClick={() => setShowCartModal(false)}
          ></div>
          <div className="relative p-5 max-h-svh overflow-auto sm:w-2/3 w-full lg:w-1/3 border rounded bg-white dark:bg-gray-900 shadow-sm">
            <button
              className="ml-auto absolute right-5 top-2 items-center rounded-lg bg-transparent p-1.5 text-sm text-gray-400 hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-gray-400 dark:hover:text-white"
              onClick={() => setShowCartModal(false)}
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
              <h2 className="text-xl font-bold mb-4">Your Cart</h2>
              <ul className="space-y-2 mb-4">
                {items.map(({ book }) => (
                  <li key={book._id} className="flex justify-between">
                    <span>{book.title}</span>
                    <span>{book.price} BDT</span>
                    <button onClick={remove}>remove</button>
                  </li>
                ))}
              </ul>
              <div className="mb-4">
                <p>Subtotal: {total} BDT</p>
                <p className="border-b">Bundle Price: {specialPrice} BDT</p>
                <p>You save: {savings} BDT</p>
              </div>
              <button
                className="bg-green-500 text-white px-4 py-2 rounded mr-2"
                onClick={() => {}}
              >
                Checkout
              </button>
              <button
                className="bg-red-400 text-white px-4 py-2 rounded"
                onClick={() => setShowCartModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
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
