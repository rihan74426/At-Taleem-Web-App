"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useUser } from "@clerk/nextjs";
import Loader from "./Loader";
import ReviewCarousel from "./ReviewCarousel";

export default function RecentPosts({
  videoLimit = 6,
  questionLimit = 5,
  bookLimit = 4,
  reviewLimit = 5,
}) {
  const { user } = useUser();

  const [videos, setVideos] = useState(null);
  const [questions, setQuestions] = useState(null);
  const [books, setBooks] = useState(null);
  const [reviews, setReviews] = useState(null);

  // fetch videos
  useEffect(() => {
    let cancelled = false;
    setVideos(null);
    fetch(`/api/videos?limit=${videoLimit}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setVideos(d.videos);
      })
      .catch(console.error);
    return () => (cancelled = true);
  }, [videoLimit]);

  // fetch questions
  useEffect(() => {
    let cancelled = false;
    setQuestions(null);
    fetch(`/api/questions?limit=${questionLimit}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setQuestions(d.questions);
      })
      .catch(console.error);
    return () => (cancelled = true);
  }, [questionLimit]);

  // fetch books
  useEffect(() => {
    let cancelled = false;
    setBooks(null);
    fetch(`/api/books?limit=${bookLimit}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setBooks(d.books);
      })
      .catch(console.error);
    return () => (cancelled = true);
  }, [bookLimit]);

  // fetch reviews
  useEffect(() => {
    let cancelled = false;
    setReviews(null);
    fetch(`/api/reviews?limit=${reviewLimit}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setReviews(d.reviews);
      })
      .catch(console.error);
    return () => (cancelled = true);
  }, [reviewLimit]);
  const cardVariant = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1 } }),
  };

  return (
    <div className="space-y-12 p-4">
      {/* ── Videos ── */}
      <section>
        <div className="flex justify-between items-baseline mb-4">
          <h2 className="text-2xl font-bold">Latest Videos</h2>
          <Link href="/taleem-videos" className="text-teal-500 hover:underline">
            View all videos →
          </Link>
        </div>
        {videos === null ? (
          <Loader />
        ) : (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
            initial="hidden"
            animate="visible"
          >
            {videos.map((v, i) => (
              <motion.div
                key={v._id}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={cardVariant}
                className="bg-white dark:bg-gray-900 border rounded-lg shadow hover:shadow-lg transition p-6"
              >
                <Link href={`/${v.category.toLowerCase()}-videos/${v._id}`}>
                  <div className="relative h-40 w-full overflow-hidden rounded-lg">
                    <Image
                      src="/thumbnail.png" // Your default thumbnail image
                      alt={v.title}
                      fill
                      className="rounded object-cover blur-sm"
                    />
                    <div className="absolute inset-0 flex items-center justify-center p-2">
                      <div className="bg-green-800 bg-opacity-80 text-white text-center px-2 py-1 rounded-lg">
                        {v.title}
                      </div>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    {new Date(
                      v.recordingDate || v.createdAt
                    ).toLocaleDateString()}
                  </p>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>

      {/* ── Questions ── */}
      <section>
        <div className="flex justify-between items-baseline mb-4">
          <h2 className="text-2xl font-bold">Recent Questions</h2>
          <Link
            href="/questionnaires"
            className="text-teal-500 hover:underline"
          >
            Answer more →
          </Link>
        </div>
        {questions === null ? (
          <Loader />
        ) : (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
            initial="hidden"
            animate="visible"
          >
            {questions.map((q, i) => (
              <motion.div
                key={q._id}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={cardVariant}
                className="bg-white dark:bg-gray-900 border rounded-lg shadow hover:shadow-lg transition p-6 flex flex-col justify-between"
              >
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
                    <span>
                      তারিখ: {new Date(q.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>

      {/* ── Books ── */}
      <section>
        <div className="flex justify-between items-baseline mb-4">
          <h2 className="text-2xl font-bold">New Books</h2>
          <Link
            href="/published-books"
            className="text-teal-500 hover:underline"
          >
            Browse all books →
          </Link>
        </div>
        {books === null ? (
          <Loader />
        ) : (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
            initial="hidden"
            animate="visible"
          >
            {books.map((b, i) => (
              <motion.div
                key={b._id}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={cardVariant}
                className="bg-white dark:bg-gray-900 border rounded-lg shadow hover:shadow-lg transition p-6"
              >
                <Link href={`/published-books/${b._id}`}>
                  <div className="relative h-56 w-full overflow-hidden rounded-lg">
                    <Image
                      src={b.coverImage}
                      alt={b.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <h3 className="mt-2 font-bold truncate">{b.title}</h3>
                  <p className="text-sm text-gray-500">{b.author}</p>
                  <p className="text-green-600 font-bold mt-1">{b.price} BDT</p>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>

      {/* ── Reviews ── */}
      <section>
        <div className="flex justify-between items-baseline mb-4">
          <h2 className="text-2xl font-bold">New Reviews</h2>
          <Link href="/about-us" className="text-teal-500 hover:underline">
            Browse all Reviews →
          </Link>
        </div>
        {reviews === null ? (
          <Loader />
        ) : reviews.length === 0 ? (
          <p className="text-center text-gray-500">No reviews yet.</p>
        ) : (
          <ReviewCarousel reviews={reviews} />
        )}
      </section>
    </div>
  );
}
