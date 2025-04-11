"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { ProgressBar, Viewer, Worker } from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import BookComments from "@/app/Components/BookComments";
import Link from "next/link";
import "@react-pdf-viewer/core/lib/styles/index.css";
import { dark } from "@clerk/themes";
import { theme } from "flowbite-react";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";

// Set up the PDF worker to point to your public folder file

export default function BookDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(600);
  const [scale, setScale] = useState(1); // For zooming
  const [numPages, setNumPages] = useState(null);
  const [pdf, setPdf] = useState(null);

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

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      } else {
        setContainerWidth(window.innerWidth - 40); // Fallback padding
      }
    };
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, [showPreview]);

  const defaultLayoutPluginInstance = defaultLayoutPlugin({
    renderPage: (props) => customRenderPage(props, book.freePages),

    toolbarPlugin: {
      renderToolbar: (Toolbar) => (
        <Toolbar>
          {(slots) => {
            const {
              CurrentPageInput,
              GoToPreviousPage,
              GoToNextPage,
              ZoomOut,
              ZoomIn,
              NumberOfPages,
              // Exclude Download and Print buttons from slots
            } = slots;
            return (
              <div className="rpv-toolbar p-2 flex items-center space-x-2 bg-gray-100 dark:bg-gray-800">
                <button
                  type="button"
                  onClick={GoToPreviousPage}
                  className="px-2 py-1 rounded hover:bg-gray-200"
                >
                  Prev
                </button>
                <CurrentPageInput /> / <NumberOfPages />
                <button
                  type="button"
                  onClick={GoToNextPage}
                  className="px-2 py-1 rounded hover:bg-gray-200"
                >
                  Next
                </button>
                <button
                  type="button"
                  onClick={ZoomOut}
                  className="px-2 py-1 rounded hover:bg-gray-200"
                >
                  -
                </button>
                <button
                  type="button"
                  onClick={ZoomIn}
                  className="px-2 py-1 rounded hover:bg-gray-200"
                >
                  +
                </button>
              </div>
            );
          }}
        </Toolbar>
      ),
    },
  });
  const onDocumentLoadSuccess = ({ numPages: loadedNumPages }) => {
    setNumPages(book.freePages);
  };
  useEffect(() => {
    if (book) setPdf(book.fullPdfUrl);
  }, [book]);

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
        <div className="mb-6 border rounded shadow ">
          <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
            <div
              className=" h-screen border rounded shadow"
              style={{
                border: "1px solid rgba(0, 0, 0, 0.3)",
                height: "750px",
              }}
            >
              <Viewer
                onDocumentLoad={onDocumentLoadSuccess}
                fileUrl={book.fullPdfUrl}
                plugins={[defaultLayoutPluginInstance]}
                theme="dark"
                renderLoader={(percentages) => (
                  <div className="">
                    <ProgressBar progress={Math.round(percentages)} />
                  </div>
                )}
              />
            </div>
          </Worker>
          <p className="mt-2 text-center text-sm text-gray-600">
            Free preview: {book.freePages} page{book.freePages > 1 ? "s" : ""}
          </p>
        </div>
      )}

      {/* Reviews / Comments Section */}
      <div className="mt-8">
        <BookComments bookId={book._id} />
      </div>
    </div>
  );
}
