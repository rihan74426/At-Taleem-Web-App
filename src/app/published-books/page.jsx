"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function BookListingPage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    fetchBooks();
  }, []);

  if (loading) return <p className="min-h-screen text-center">Loading...</p>;
  if (!books.length > 0)
    return <p className="min-h-screen text-center">No Books Published Yet!</p>;

  return (
    <div className="max-w-6xl min-h-screen mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Books</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {books.map((book) => (
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
            <Link href={`/published-books/${book._id}`}>
              <button className="mt-2 inline-block bg-blue-500 text-white px-4 py-2 rounded">
                View Details
              </button>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
