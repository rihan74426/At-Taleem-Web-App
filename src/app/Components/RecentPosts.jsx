"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

export default function RecentPosts({
  videoLimit = 5,
  questionLimit = 5,
  bookLimit = 6,
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
    hidden: { opacity: 0, x: 50 },
    visible: (i) => ({ opacity: 1, x: 0, transition: { delay: i * 0.1 } }),
  };

  if (loading) return <div className="p-8 text-center">Loading…</div>;

  return (
    <div className="p-4">
      {/* Videos */}
      <Section
        title="Latest Videos"
        linkText="View all videos"
        linkHref="/taleem-videos"
      >
        {videos.map((v, i) => (
          <motion.div
            key={v._id}
            custom={i}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={cardVariant}
            className="w-64 border rounded shadow-lg"
          >
            <Link href={`/videos/${v._id}`}>
              <div className="relative h-36 w-full">
                <Image
                  src="/thumbnail.png"
                  alt=""
                  fill
                  className="object-cover blur-sm"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                  <span className="text-white text-center px-2">{v.title}</span>
                </div>
              </div>
              <div className="p-2">
                <p className="text-sm text-gray-500">
                  {new Date(v.recordingDate).toLocaleDateString()}
                </p>
              </div>
            </Link>
          </motion.div>
        ))}
      </Section>

      {/* Questions */}
      <Section
        title="Recent Questions"
        linkText="Answer more"
        linkHref="/questionnaires"
      >
        {questions.map((q, i) => (
          <motion.div
            key={q._id}
            custom={i}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={cardVariant}
            className="w-64 border rounded shadow p-3"
          >
            <Link href={`/questionnaires/${q._id}`}>
              <h2 className="text-xl  font-semibold text-gray-900 dark:text-gray-100">
                {q.title}
              </h2>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                {q.description?.length > 100
                  ? `${q.description.substring(0, 100)}...`
                  : q.description || "বিস্তারিত নেই"}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
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
          </motion.div>
        ))}
      </Section>

      {/* Books */}
      <Section
        title="New Books"
        linkText="Browse all books"
        linkHref="/published-books"
      >
        {books.map((b, i) => (
          <motion.div
            key={b._id}
            custom={i}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={cardVariant}
            className="w-48 border rounded-lg overflow-hidden shadow"
          >
            <Link href={`/published-books/${b._id}`}>
              <div className="relative h-60 w-full">
                <Image
                  src={b.coverImage}
                  alt=""
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-2">
                <h3 className="text-md font-semibold">{b.title}</h3>
                <p className="text-sm text-gray-500">{b.author}</p>
                <p className="text-green-600 font-bold mt-1">{b.price} BDT</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </Section>
    </div>
  );
}

function Section({ title, linkText, linkHref, children }) {
  return (
    <section>
      <div className="flex justify-between mb-4">
        <h2 className="text-2xl font-bold">{title}</h2>
        <Link href={linkHref} className="text-teal-500 hover:underline">
          {linkText}
        </Link>
      </div>
      <div className="flex space-x-4  pb-2">{children}</div>
    </section>
  );
}
