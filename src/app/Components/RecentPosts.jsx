"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import Loader from "./Loader";

export default function RecentPosts({
  videoLimit = 6,
  questionLimit = 5,
  bookLimit = 4,
}) {
  const [videos, setVideos] = useState(null);
  const [questions, setQuestions] = useState(null);
  const [books, setBooks] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      const [vRes, qRes, bRes] = await Promise.all([
        fetch(`/api/videos?limit=${videoLimit}`),
        fetch(`/api/questions?limit=${questionLimit}`),
        fetch(`/api/books?limit=${bookLimit}`),
      ]);
      const [{ videos }, { questions }, { books }] = await Promise.all([
        vRes.json(),
        qRes.json(),
        bRes.json(),
      ]);
      setVideos(videos);
      setQuestions(questions);
      setBooks(books);
      setLoading(false);
    }
    fetchAll();
  }, [videoLimit, questionLimit, bookLimit]);

  const cardVariant = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1 } }),
  };

  if (loading)
    return (
      <div className="flex items-center place-content-center">
        <Loader />
      </div>
    );

  return (
    <div className="space-y-12 p-4">
      <GridSection
        title="Latest Videos"
        linkText="View all videos"
        linkHref="/taleem-videos"
      >
        {videos.map((v, i) => (
          <Card key={v._id} i={i} variants={cardVariant}>
            <Link href={`/videos/${v._id}`} className="block">
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
              <h3 className="font-bold m-1 truncate">{v.title}</h3>

              <p className="text-sm text-gray-500 mt-1">
                {new Date(v.recordingDate || v.createdAt).toLocaleDateString()}
              </p>
            </Link>
          </Card>
        ))}
      </GridSection>

      <GridSection
        title="Recent Questions"
        linkText="More Questions"
        linkHref="/questionnaires"
      >
        {questions.map((q, i) => (
          <Card key={q._id} i={i} variants={cardVariant} vertical>
            <Link href={`/questionnaires/${q._id}`} className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 line-clamp-3">
                {q.title}
              </h2>
              <p className="mt-2 text-gray-600 dark:text-gray-300 truncate">
                {q.description !== "" && q.description}
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-sm text-gray-500">
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
      </GridSection>

      <GridSection
        title="New Books"
        linkText="Browse all books"
        linkHref="/published-books"
      >
        {books.map((b, i) => (
          <Card key={b._id} i={i} variants={cardVariant}>
            <Link href={`/published-books/${b._id}`} className="block">
              <div className="relative h-56 w-full overflow-hidden rounded-lg">
                <Image
                  src={b.coverImage}
                  alt={b.title}
                  fill
                  className="object-cover"
                />
              </div>
              <h3 className="font-bold m-1 truncate">{b.title}</h3>
              <p className="text-sm text-gray-500">{b.author}</p>
              <p className="text-green-600 font-bold mt-2">{b.price} BDT</p>
            </Link>
          </Card>
        ))}
      </GridSection>
    </div>
  );
}

function GridSection({ title, linkText, linkHref, children }) {
  return (
    <section>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
        <h2 className="text-2xl font-bold mb-2 sm:mb-0">{title}</h2>
        <Link href={linkHref} className="text-teal-500 hover:underline text-md">
          {linkText} &#8594;
        </Link>
      </div>
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
        initial="hidden"
        animate="visible"
      >
        {children}
      </motion.div>
    </section>
  );
}

function Card({ children, i, variants, vertical = false }) {
  return (
    <motion.div
      custom={i}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={variants}
      className={`bg-white dark:bg-gray-900 border rounded-lg shadow hover:shadow-lg transition p-6 flex flex-col ${
        vertical ? "justify-between" : ""
      }`}
    >
      {children}
    </motion.div>
  );
}
