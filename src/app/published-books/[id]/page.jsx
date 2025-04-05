"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
// Core viewer
import { Viewer, Worker } from "@react-pdf-viewer/core";

// Plugins

// Import styles
import "@react-pdf-viewer/core/lib/styles/index.css";

// Create new plugin instance

export default function BookDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [numPages, setNumPages] = useState(null);

  // Fetch book details from your API
  useEffect(() => {
    const fetchBook = async () => {
      try {
        const res = await fetch(`/api/books?id=${id}`);
        if (!res.ok) throw new Error("Failed to fetch book");
        const data = await res.json();
        if (!data.book) throw new Error("Book not found");
        setBook(data.book);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchBook();
  }, [id]);

  const onDocumentLoadSuccess = ({ numPages: loadedNumPages }) => {
    setNumPages(loadedNumPages);
  };

  if (loading)
    return <p className="text-center text-gray-500 min-h-screen">Loading...</p>;
  if (error)
    return <p className="text-center text-red-500 min-h-screen">{error}</p>;
  if (!book)
    return (
      <p className="text-center text-gray-500 min-h-screen">Book not found</p>
    );

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Large Cover Image */}
      <div className="relative w-full h-96 mb-6">
        <Image
          src={book.coverImage}
          alt={book.title}
          fill
          className="object-cover rounded shadow-lg"
          priority
        />
      </div>

      {/* Book Details */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{book.title}</h1>
        <p className="text-xl text-gray-700">by {book.author}</p>
        <p className="mt-4 text-gray-600">{book.description}</p>
      </div>

      {/* Read Preview Section */}
      <div className="mb-6">
        <button
          className="bg-green-500 text-white px-4 py-2 rounded"
          onClick={() => setShowPreview((prev) => !prev)}
        >
          {showPreview ? "Hide Preview" : "Read Preview"}
        </button>
      </div>

      {showPreview && (
        <div className="mb-6 border rounded shadow overflow-hidden">
          <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
            <Viewer
              fileUrl={book.fullPdfUrl}
              plugins={
                [
                  // Register plugins
                ]
              }
            />
          </Worker>
          <p className="mt-2 text-center text-sm text-gray-600">
            Free preview: {book.freePages} page
            {book.freePages > 1 ? "s" : ""}
          </p>
        </div>
      )}

      {/* Reviews / Comments Section */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Reviews</h2>
        {/* Include your book reviews/comments component here */}
      </div>

      {/* Purchase Button */}
      <div className="mt-8">
        <button
          className="bg-blue-500 text-white px-6 py-3 rounded text-xl"
          onClick={() => router.push(`/books/${book._id}/purchase`)}
        >
          Buy Now
        </button>
      </div>
    </div>
  );
}
