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
import CheckoutModal from "@/app/Components/CheckoutModal";
import Loader from "@/app/Components/Loader";
import { FaShare, FaWhatsapp, FaFacebook, FaTwitter } from "react-icons/fa";
import { toast } from "react-hot-toast";
import ResponseModal from "@/app/Components/ResponseModal";

// Book Detail Skeleton Component
function BookDetailSkeleton() {
  return (
    <div className="max-w-6xl mx-auto p-4 animate-pulse">
      {/* Cover Image Skeleton */}
      <div className="relative w-full h-96 mb-6 bg-gray-200 dark:bg-gray-700 rounded shadow-lg"></div>

      {/* Book Details Skeleton */}
      <div className="mb-6">
        <div className="h-8 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
        <div className="h-6 w-1/3 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
        </div>
      </div>

      {/* Action Buttons Skeleton */}
      <div className="mb-6 flex gap-4">
        <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>

      {/* Preview Section Skeleton */}
      <div className="mb-6 border rounded shadow">
        <div className="h-[750px] bg-gray-200 dark:bg-gray-700"></div>
        <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded mx-auto mt-2"></div>
      </div>

      {/* Comments Section Skeleton */}
      <div className="mt-8">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
        <div className="space-y-4">
          {[1, 2, 3].map((index) => (
            <div key={index} className="border-b pb-4">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div>
                  <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              </div>
              <div className="space-y-2 ml-16">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

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
  const [checkoutModal, setCheckoutModal] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [modal, setModal] = useState({
    isOpen: false,
    message: "",
    status: "",
  });

  // Memoized handlers
  const showModal = (message, status) => {
    setModal({ isOpen: true, message, status });
  };

  // Fetch book details from your API
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
  useEffect(() => {
    fetchBook();
    if (book) setPdf(book.fullPdfUrl);
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

  const handleShare = (platform) => {
    const url = window.location.href;
    const title = book?.title || "Check out this book on Taleem";

    switch (platform) {
      case "whatsapp":
        window.open(
          `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`
        );
        break;
      case "facebook":
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
            url
          )}`
        );
        break;
      case "twitter":
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(
            title
          )}&url=${encodeURIComponent(url)}`
        );
        break;
      case "copy":
        navigator.clipboard.writeText(url);
        showModal("Link copied to clipboard!", "success");
        break;
    }
    setShowShareOptions(false);
  };

  // Custom PDF loading component
  const CustomLoader = ({ progress }) => (
    <div className="flex flex-col items-center justify-center h-full bg-gray-50 dark:bg-gray-900">
      <div className="w-64 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="mt-4 text-gray-600 dark:text-gray-300">
        Loading preview... {Math.round(progress)}%
      </p>
    </div>
  );

  if (loading) return <BookDetailSkeleton />;

  if (error)
    return <p className="text-center text-red-500 min-h-screen">{error}</p>;

  if (!book)
    return (
      <p className="text-center text-gray-500 min-h-screen">Book not found</p>
    );

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Large Cover Image with Overlay */}
      <div className="relative w-full h-96 mb-6 group">
        <Image
          src={book.coverImage}
          alt={book.title}
          fill
          className="object-cover rounded shadow-lg transition-transform duration-300 group-hover:scale-105"
          priority
        />
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 rounded shadow-lg" />
      </div>

      {/* Book Details with Enhanced UI */}
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {book.title}
            </h1>
            <p className="text-xl text-gray-700 dark:text-gray-300 mt-2">
              by {book.author}
            </p>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowShareOptions(!showShareOptions)}
              className="p-2 flex rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Share"
            >
              Share{" "}
              <span className="m-3">
                <FaShare />
              </span>
            </button>
            {showShareOptions && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-2 z-10">
                <button
                  onClick={() => handleShare("whatsapp")}
                  className="flex items-center w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <FaWhatsapp className="text-green-500 mr-2" /> WhatsApp
                </button>
                <button
                  onClick={() => handleShare("facebook")}
                  className="flex items-center w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <FaFacebook className="text-blue-500 mr-2" /> Facebook
                </button>
                <button
                  onClick={() => handleShare("twitter")}
                  className="flex items-center w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <FaTwitter className="text-blue-400 mr-2" /> Twitter
                </button>
                <button
                  onClick={() => handleShare("copy")}
                  className="flex items-center w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Copy Link
                </button>
              </div>
            )}
          </div>
        </div>
        <p className="mt-4 text-gray-600 dark:text-gray-400 leading-relaxed">
          {book.description}
        </p>
      </div>

      {/* Enhanced Action Buttons */}
      <div className="mb-6 flex flex-wrap gap-4">
        <button
          className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg transition-colors flex items-center"
          onClick={() => setShowPreview((prev) => !prev)}
        >
          {showPreview ? "Hide Preview" : "Read Preview"}
        </button>
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors flex items-center"
          onClick={() => setCheckoutModal(true)}
        >
          Buy Now
        </button>
      </div>

      <CheckoutModal
        open={checkoutModal}
        onClose={() => setCheckoutModal(false)}
        items={[{ book, qty: 1 }]}
      />

      {/* Enhanced Preview Section */}
      {showPreview && (
        <div className="mb-6 border rounded-lg shadow-lg overflow-hidden">
          <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
            <div
              className="h-screen border rounded-lg shadow-lg"
              style={{
                border: "1px solid rgba(0, 0, 0, 0.3)",
                height: "750px",
              }}
            >
              <Viewer
                onDocumentLoad={onDocumentLoadSuccess}
                fileUrl={pdf}
                plugins={[defaultLayoutPluginInstance]}
                theme="dark"
                renderLoader={(percentages) => (
                  <CustomLoader progress={percentages} />
                )}
              />
            </div>
          </Worker>
          <div className="bg-gray-50 dark:bg-gray-800 p-4 border-t">
            <p className="text-center text-sm text-gray-600 dark:text-gray-400">
              Free preview: {book.freePages} page{book.freePages > 1 ? "s" : ""}
            </p>
          </div>
        </div>
      )}

      {/* Enhanced Comments Section */}
      <div className="mt-8">
        <BookComments bookId={book._id} />
      </div>
      <ResponseModal
        isOpen={modal.isOpen}
        message={modal.message}
        status={modal.status}
        onClose={() => setModal({ ...modal, isOpen: false })}
      />
    </div>
  );
}
