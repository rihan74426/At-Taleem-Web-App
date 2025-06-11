"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useUser } from "@clerk/nextjs";
import ReviewCarousel from "./ReviewCarousel";
import { formatDistanceToNow } from "date-fns";

import {
  BsEye,
  BsHeart,
  BsPlayFill,
  BsBook,
  BsPatchQuestion,
} from "react-icons/bs";

// Types
const DataState = {
  LOADING: "loading",
  SUCCESS: "success",
  ERROR: "error",
};

// Updated card variant for smoother animations
const cardVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: "easeOut",
    },
  }),
};

// Custom hook for data fetching
const useDataFetching = (endpoint, limit) => {
  const [data, setData] = useState(null);
  const [state, setState] = useState(DataState.LOADING);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState(DataState.LOADING);
    setData(null);
    setError(null);

    const fetchData = async () => {
      try {
        const response = await fetch(
          `${endpoint}?limit=${limit}&page=1&search=&category=`,
          {
            cache: "no-store",
            headers: {
              "Cache-Control": "no-cache",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (!cancelled) {
          // Handle different response structures
          if (endpoint === "/api/books") {
            setData(result.books || []);
          } else if (endpoint === "/api/videos") {
            setData(result.videos || []);
          } else if (endpoint === "/api/questions") {
            setData(result.questions || []);
          } else if (endpoint === "/api/reviews") {
            setData(result.reviews || []);
          } else {
            setData(result[endpoint.split("/").pop()] || []);
          }
          setState(DataState.SUCCESS);
        }
      } catch (err) {
        if (!cancelled) {
          console.error(`Error fetching ${endpoint}:`, err);
          setError(err.message);
          setState(DataState.ERROR);

          // Retry logic for failed requests
          if (retryCount < 2) {
            setTimeout(() => {
              setRetryCount((prev) => prev + 1);
            }, 1000 * (retryCount + 1)); // Exponential backoff
          }
        }
      }
    };

    fetchData();
    return () => (cancelled = true);
  }, [endpoint, limit, retryCount]);

  return { data, state, error };
};

const formatViews = (views) => {
  if (!views) return "0";
  if (views >= 1000000) {
    return `${(views / 1000000).toFixed(1)}M`;
  } else if (views >= 1000) {
    return `${(views / 1000).toFixed(1)}K`;
  }
  return views.toString();
};
// Updated Card component with better styling
const Card = ({ children, index, className = "" }) => (
  <motion.div
    custom={index}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: "-50px" }}
    variants={cardVariant}
    className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden ${className}`}
  >
    {children}
  </motion.div>
);

// Updated VideoSkeleton with better design
const VideoSkeleton = () => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 animate-pulse">
    <div className="relative h-48 w-full bg-gray-200 dark:bg-gray-700 rounded-xl overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-900/50"></div>
    </div>
    <div className="mt-4 space-y-2">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
    </div>
  </div>
);

// Updated QuestionSkeleton with better design
const QuestionSkeleton = () => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 animate-pulse">
    <div className="space-y-4">
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-xl w-3/4"></div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
      </div>
      <div className="flex gap-2 mt-4">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-20"></div>
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-24"></div>
      </div>
    </div>
  </div>
);

// Updated BookSkeleton with better design
const BookSkeleton = () => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 animate-pulse">
    <div className="relative h-64 w-full bg-gray-200 dark:bg-gray-700 rounded-xl overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-900/50"></div>
    </div>
    <div className="mt-4 space-y-2">
      <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
    </div>
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

// Add MasalahSkeleton component
const MasalahSkeleton = () => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 animate-pulse">
    <div className="space-y-4">
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-xl w-3/4"></div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
      </div>
      <div className="flex gap-2 mt-4">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-20"></div>
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-24"></div>
      </div>
    </div>
  </div>
);

export default function RecentPosts({
  videoLimit = 6,
  questionLimit = 5,
  bookLimit = 4,
  reviewLimit = 5,
  masalahLimit = 4,
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

  const {
    data: masalah,
    state: masalahState,
    error: masalahError,
  } = useDataFetching("/api/masalah", masalahLimit);

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
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      initial="hidden"
      animate="visible"
    >
      {videos?.map((video, i) => (
        <Card key={video._id} index={i}>
          <Link
            href={`/${video.category.toLowerCase()}-videos/${video._id}`}
            className=" cursor-pointer"
          >
            <div className="relative aspect-video overflow-hidden">
              <div className="relative w-full h-36">
                <Image
                  src={video.thumbnailUrl || "/thumbnail.png"}
                  alt={video.title}
                  fill
                  className="rounded object-cover blur-sm transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    e.target.src = "/thumbnail.png";
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center p-2">
                  <div className="bg-green-800 bg-opacity-80 text-white text-center px-2 py-1 rounded-lg">
                    {video.title}
                  </div>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Platform Badge */}
              <div className="absolute top-2 right-2 px-2 py-1 bg-black/70 text-white text-xs rounded-full">
                {video.platform}
              </div>

              {/* Play Button Overlay */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center">
                  <BsPlayFill className="text-blue-600" size={24} />
                </div>
              </div>
            </div>
          </Link>

          {/* Content */}
          <Link
            href={`/${video.category.toLowerCase()}-videos/${video._id}`}
            className="cursor-pointer"
          >
            <div className="p-4">
              <h3 className="font-semibold text-lg mb-2 line-clamp-2 text-gray-900 dark:text-white">
                {video.title}
              </h3>

              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
                <div className="flex items-center gap-2">
                  <BsEye className="text-blue-500" />
                  <span>{formatViews(video.views)} views</span>
                </div>
                <div className="flex items-center gap-2">
                  <BsHeart className="text-red-500" />
                  <span>{video.likes?.length || 0}</span>
                </div>
              </div>

              <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {video.recordingDate &&
                  formatDistanceToNow(new Date(video.recordingDate), {
                    addSuffix: true,
                  })}
              </div>
            </div>
          </Link>
        </Card>
      ))}
    </motion.div>
  );

  const renderQuestions = () => (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      initial="hidden"
      animate="visible"
    >
      {questions?.map((q, i) => (
        <Card key={q._id} index={i} className="flex flex-col justify-between">
          <Link href={`/questionnaires/${q._id}`} className="block p-6">
            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white line-clamp-2">
              {q.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 line-clamp-3 mb-4">
              {q.description || "বিস্তারিত নেই"}
            </p>
            <div className="mt-auto space-y-2">
              <div className="flex flex-wrap gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-sm ${
                    q.status === "answered"
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                  }`}
                >
                  {q.status.charAt(0).toUpperCase() + q.status.slice(1)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                <span>{q.isAnonymous ? "অজ্ঞাতনামা" : q.username}</span>
                <span>{new Date(q.createdAt).toLocaleDateString("bn-BD")}</span>
              </div>
            </div>
          </Link>
        </Card>
      ))}
    </motion.div>
  );

  const renderBooks = () => (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      initial="hidden"
      animate="visible"
    >
      {books?.map((b, i) => (
        <Card key={b._id} index={i}>
          <Link href={`/published-books/${b._id}`} className="block">
            <div className="relative h-64 w-full overflow-hidden group">
              <Image
                src={b.coverImage || "/book-placeholder.png"}
                alt={b.title}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                priority={i < 2}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-900/70"></div>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate">
                {b.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {b.author}
              </p>
              <p className="text-teal-600 dark:text-teal-400 font-bold mt-2">
                {b.price} BDT
              </p>
              {b.categories && b.categories.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {b.categories.map((cat) => (
                    <span
                      key={cat._id}
                      className="text-xs bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full"
                    >
                      {cat.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Link>
        </Card>
      ))}
    </motion.div>
  );

  const renderMasalah = () => (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      initial="hidden"
      animate="visible"
    >
      {masalah?.map((m, i) => (
        <Card key={m._id} index={i} className="flex flex-col justify-between">
          <Link href={`/masalah/${m._id}`} className="block p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900 flex items-center justify-center">
                <BsPatchQuestion
                  className="text-teal-600 dark:text-teal-400"
                  size={20}
                />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2">
                  {m.title}
                </h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  {m.categories.map((cat) => (
                    <span
                      key={cat._id}
                      className="text-xs bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full"
                    >
                      {cat.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-gray-600 dark:text-gray-300 line-clamp-3">
                {m.description}
              </p>

              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-700">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {formatDistanceToNow(new Date(m.createdAt), {
                    addSuffix: true,
                  })}
                </div>
                <div className="flex items-center gap-2">
                  <BsHeart className="text-red-500" />
                  <span>{m.likers.length}</span>
                </div>
              </div>
            </div>
          </Link>
        </Card>
      ))}
    </motion.div>
  );

  return (
    <div className="space-y-12 p-4">
      {renderSection(
        "সাম্প্রতিক ভিডিও",
        "সকল ভিডিও দেখুন",
        "/taleem-videos",
        renderVideos(),
        videosState,
        videosError,
        <VideoSkeleton />
      )}

      {renderSection(
        "সাম্প্রতিক প্রশ্ন",
        "সকল প্রশ্ন দেখুন",
        "/questionnaires",
        renderQuestions(),
        questionsState,
        questionsError,
        <QuestionSkeleton />
      )}

      {renderSection(
        "সাম্প্রতিক বই",
        "সকল বই দেখুন",
        "/published-books",
        renderBooks(),
        booksState,
        booksError,
        <BookSkeleton />
      )}
      {renderSection(
        "সাম্প্রতিক মাসআলা",
        "সকল মাসআলা দেখুন",
        "/masalah",
        renderMasalah(),
        masalahState,
        masalahError,
        <MasalahSkeleton />
      )}

      {renderSection(
        "সাম্প্রতিক রিভিউ",
        "সব রিভিউ দেখুন",
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
