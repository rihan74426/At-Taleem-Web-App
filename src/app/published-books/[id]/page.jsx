"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";
import BookComments from "@/app/Components/BookComments";

// Set up the PDF worker to point to your public folder file
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

export default function BookDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(600);

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
  const options = useMemo(() => {
    return {
      cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
    };
  }, []);
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

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
      <div className="mb-6 ">
        <button
          className="bg-green-500 mr-5 text-white px-4 py-2 rounded"
          onClick={() => setShowPreview((prev) => !prev)}
        >
          {showPreview ? "Hide Preview" : "Read Preview"}
        </button>
        <button
          className="bg-blue-500 my-5 text-white px-4 py-2 rounded text-xl"
          onClick={() => router.push(`/published-books/${book._id}/purchase`)}
        >
          Buy Now
        </button>
      </div>

      {showPreview && (
        <div className="fixed inset-0 flex items-center justify-center z-40">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowPreview(false)}
          ></div>
          {/* Modal Content */}
          <div
            ref={containerRef}
            className="mb-6  overflow-y-auto relative bg-white dark:bg-gray-800 rounded shadow-lg p-4"
            style={{ maxHeight: "80vh" }}
          >
            <button
              className=" fixed z-50 right-8 p-2 rounded top-8 sm:right-56 bg-yellow-300 dark:text-white dark:bg-gray-800 "
              onClick={() => setShowPreview(false)}
            >
              ✖
            </button>
            <div className="mb-4 sm:mb-6 overflow-y-auto rounded shadow  place-self-center dark:bg-gray-800">
              <Document
                file={book.fullPdfUrl}
                onLoadError={(err) => console.error("Error loading PDF:", err)}
                renderMode="canvas"
              >
                {Array.from({ length: book.freePages }).map((_, index) => (
                  <Page
                    key={`page_${index + 1}`}
                    pageNumber={index + 1}
                    width={containerWidth}
                    className="border-b mb-2 overflow-auto"
                  />
                ))}
              </Document>
            </div>
            <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
              Free preview: {book.freePages} page{book.freePages > 1 ? "s" : ""}
              . Purchase the book to read more.
            </p>
          </div>
        </div>
      )}

      {/* Reviews / Comments Section */}
      <div className="mt-8">
        <BookComments bookId={book._id} />
      </div>
    </div>
  );
}
