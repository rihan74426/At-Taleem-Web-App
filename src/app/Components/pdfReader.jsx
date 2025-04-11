import { useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
export default function pdfReader() {
  const [showPreview, setShowPreview] = useState(false);
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(600);
  const [scale, setScale] = useState(1);

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

  return (
    <div>
      {" "}
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
            <div className="flex justify-center items-center gap-4 mb-4">
              <button
                onClick={() => setScale((prev) => Math.min(prev + 0.1, 3))}
                className="px-3 py-1 bg-green-600 text-white rounded"
              >
                +
              </button>
              <span className="text-white dark:text-gray-300">
                Zoom: {(scale * 100).toFixed(0)}%
              </span>
              <button
                onClick={() => setScale((prev) => Math.max(prev - 0.1, 0.5))}
                className="px-3 py-1 bg-red-600 text-white rounded"
              >
                −
              </button>
            </div>
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
                  scale={scale}
                  className="border-b mb-2 overflow-auto"
                  renderTextLayer={false}
                />
              ))}
            </Document>
          </div>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Free preview: {book.freePages} page{book.freePages > 1 ? "s" : ""}.{" "}
            <Link
              href={`/published-books/${book._id}/purchase`}
              className="text-blue-500 hover:border-b hover:cursor-pointer"
            >
              Purchase the book
            </Link>{" "}
            to read more.
          </p>
        </div>
      </div>
    </div>
  );
}
