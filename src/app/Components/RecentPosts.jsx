"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useUser } from "@clerk/nextjs";
import Loader from "./Loader";
import ReviewCarousel from "./ReviewCarousel";

// Types
const DataState = {
  LOADING: "loading",
  SUCCESS: "success",
  ERROR: "error",
};

const cardVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1 } }),
};

// Custom hook for data fetching
const useDataFetching = (endpoint, limit) => {
  const [data, setData] = useState(null);
  const [state, setState] = useState(DataState.LOADING);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setState(DataState.LOADING);
    setData(null);
    setError(null);

    const fetchData = async () => {
      try {
        const response = await fetch(
          `${endpoint}?limit=${limit}&page=1&search=&category=`
        );
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();

        if (!cancelled) {
          // Handle different response structures
          if (endpoint === "/api/books") {
            setData(result.books);
          } else if (endpoint === "/api/videos") {
            setData(result.videos);
          } else if (endpoint === "/api/questions") {
            setData(result.questions);
          } else if (endpoint === "/api/reviews") {
            setData(result.reviews);
          } else {
            setData(result[endpoint.split("/").pop()]);
          }
          setState(DataState.SUCCESS);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
          setState(DataState.ERROR);
        }
      }
    };

    fetchData();
    return () => (cancelled = true);
  }, [endpoint, limit]);

  return { data, state, error };
};

// Card component for reusability
const Card = ({ children, index, className = "" }) => (
  <motion.div
    custom={index}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true }}
    variants={cardVariant}
    className={`bg-white dark:bg-gray-900 border rounded-lg shadow hover:shadow-lg transition p-6 ${className}`}
  >
    {children}
  </motion.div>
);

// Skeleton loader components
const VideoSkeleton = () => (
  <div className="bg-white dark:bg-gray-900 border rounded-lg shadow p-6 animate-pulse">
    <div className="relative h-40 w-full bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
    <div className="mt-2 h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
  </div>
);

const QuestionSkeleton = () => (
  <div className="bg-white dark:bg-gray-900 border rounded-lg shadow p-6 animate-pulse">
    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
    <div className="space-y-2">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
    </div>
    <div className="mt-4 flex gap-2">
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
    </div>
  </div>
);

const BookSkeleton = () => (
  <div className="bg-white dark:bg-gray-900 border rounded-lg shadow p-6 animate-pulse">
    <div className="relative h-56 w-full bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
    <div className="mt-2 h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
    <div className="mt-1 h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
    <div className="mt-1 h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
  </div>
);

const ReviewSkeleton = () => (
  <div className="bg-white dark:bg-gray-900 border rounded-lg shadow p-6 animate-pulse">
    <div className="flex items-center gap-4">
      <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
      </div>
    </div>
    <div className="mt-4 space-y-2">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
    </div>
  </div>
);

export default function RecentPosts({
  videoLimit = 6,
  questionLimit = 5,
  bookLimit = 4,
  reviewLimit = 5,
}) {
  const { user } = useUser();

  const {
    data: videos,
    state: videosState,
    error: videosError,
  } = useDataFetching("/api/videos", videoLimit);

  const {
    data: questions,
    state: questionsState,
    error: questionsError,
  } = useDataFetching("/api/questions", questionLimit);

  const {
    data: books,
    state: booksState,
    error: booksError,
  } = useDataFetching("/api/books", bookLimit);

  const {
    data: reviews,
    state: reviewsState,
    error: reviewsError,
  } = useDataFetching("/api/reviews", reviewLimit);

  const renderError = (error) => (
    <div className="text-red-500 text-center p-4">
      Error loading content: {error}
    </div>
  );

  const renderSection = (
    title,
    linkText,
    linkHref,
    content,
    state,
    error,
    skeletonComponent
  ) => (
    <section>
      <div className="flex justify-between items-baseline mb-4">
        <h2 className="text-2xl font-bold">{title}</h2>
        <Link href={linkHref} className="text-teal-500 hover:underline">
          {linkText} →
        </Link>
      </div>
      {state === DataState.LOADING ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i}>{skeletonComponent}</div>
          ))}
        </div>
      ) : state === DataState.ERROR ? (
        renderError(error)
      ) : (
        content
      )}
    </section>
  );

  const renderVideos = () => (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
      initial="hidden"
      animate="visible"
    >
      {videos?.map((v, i) => (
        <Card key={v._id} index={i}>
          <Link href={`/${v.category.toLowerCase()}-videos/${v._id}`}>
            <div className="relative h-40 w-full overflow-hidden rounded-lg">
              <Image
                src="/thumbnail.png"
                alt={v.title}
                fill
                className="rounded object-cover blur-sm"
                priority={i < 2}
              />
              <div className="absolute inset-0 flex items-center justify-center p-2">
                <div className="bg-green-800 bg-opacity-80 text-white text-center px-2 py-1 rounded-lg">
                  {v.title}
                </div>
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              {new Date(v.recordingDate || v.createdAt).toLocaleDateString()}
            </p>
          </Link>
        </Card>
      ))}
    </motion.div>
  );

  const renderQuestions = () => (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
      initial="hidden"
      animate="visible"
    >
      {questions?.map((q, i) => (
        <Card key={q._id} index={i} className="flex flex-col justify-between">
          <Link href={`/questionnaires/${q._id}`}>
            <h3 className="text-xl font-semibold mb-2">{q.title}</h3>
            <p className="text-gray-600 dark:text-gray-300 line-clamp-3">
              {q.description || "বিস্তারিত নেই"}
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span
                className={`px-2 py-1 rounded ${
                  q.status === "answered"
                    ? "bg-green-200 text-green-800"
                    : "bg-yellow-200 text-yellow-800"
                }`}
              >
                {q.status.charAt(0).toUpperCase() + q.status.slice(1)}
              </span>
              <span>
                প্রশ্নকারী: {q.isAnonymous ? "অজ্ঞাতনামা" : q.username}
              </span>
              <span>তারিখ: {new Date(q.createdAt).toLocaleDateString()}</span>
            </div>
          </Link>
        </Card>
      ))}
    </motion.div>
  );

  const renderBooks = () => (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
      initial="hidden"
      animate="visible"
    >
      {books?.map((b, i) => (
        <Card key={b._id} index={i}>
          <Link href={`/published-books/${b._id}`}>
            <div className="relative h-56 w-full overflow-hidden rounded-lg">
              <Image
                src={b.coverImage || "/book-placeholder.png"}
                alt={b.title}
                fill
                className="object-cover"
                priority={i < 2}
              />
            </div>
            <h3 className="mt-2 font-bold truncate">{b.title}</h3>
            <p className="text-sm text-gray-500">{b.author}</p>
            <p className="text-green-600 font-bold mt-1">{b.price} BDT</p>
            {b.categories && b.categories.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {b.categories.map((cat) => (
                  <span
                    key={cat._id}
                    className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded"
                  >
                    {cat.name}
                  </span>
                ))}
              </div>
            )}
          </Link>
        </Card>
      ))}
    </motion.div>
  );

  return (
    <div className="space-y-12 p-4">
      {renderSection(
        "Latest Videos",
        "View all videos",
        "/taleem-videos",
        renderVideos(),
        videosState,
        videosError,
        <VideoSkeleton />
      )}

      {renderSection(
        "Recent Questions",
        "Answer more",
        "/questionnaires",
        renderQuestions(),
        questionsState,
        questionsError,
        <QuestionSkeleton />
      )}

      {renderSection(
        "New Books",
        "Browse all books",
        "/published-books",
        renderBooks(),
        booksState,
        booksError,
        <BookSkeleton />
      )}

      {renderSection(
        "New Reviews",
        "Browse all Reviews",
        "/about-us",
        reviews?.length === 0 ? (
          <p className="text-center text-gray-500">No reviews yet.</p>
        ) : (
          <ReviewCarousel reviews={reviews} />
        ),
        reviewsState,
        reviewsError,
        <ReviewSkeleton />
      )}
    </div>
  );
}
