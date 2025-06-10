"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import Loader from "../Components/Loader";
import { ReviewCard } from "../about-us/page";
import Image from "next/image";

export default function ReviewCarousel({ reviews }) {
  const [current, setCurrent] = useState(0);
  const [imageError, setImageError] = useState(false);
  const timerRef = useRef();

  const length = reviews?.length ?? 0;

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % length);
  }, [length]);

  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + length) % length);
  }, [length]);

  // auto‑advance every 5s
  useEffect(() => {
    if (length > 1) {
      timerRef.current = setInterval(next, 5000);
      return () => clearInterval(timerRef.current);
    }
  }, [next]);

  const rev = reviews[current];

  if (!rev) return null;

  return (
    <div className="relative w-full overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={rev._id}
          className="relative inset-0"
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -300, opacity: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div
            className="relative bg-white dark:bg-gray-800 rounded-[2rem] shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
            style={{
              clipPath: "polygon(0 0, 100% 0, 100% 85%, 85% 100%, 0 100%)",
            }}
          >
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 dark:bg-teal-500/20 rounded-bl-full" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-500/10 dark:bg-amber-500/20 rounded-tr-full" />

            <div className="p-6 relative">
              {/* Header Section */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-4">
                  {rev.userProfilePic && !imageError ? (
                    <div className="relative w-16 h-16">
                      <Image
                        src={rev.userProfilePic}
                        alt={rev.userName}
                        fill
                        sizes="64px"
                        className="rounded-full object-cover border-2 border-teal-500"
                        onError={() => setImageError(true)}
                        priority={false}
                        loading="lazy"
                        quality={75}
                      />
                    </div>
                  ) : (
                    <div className="relative w-16 h-16 dark:bg-gray-800">
                      <Image
                        src="/default-user.png"
                        alt={rev.userName}
                        fill
                        sizes="64px"
                        className="rounded-full object-cover border-2 border-teal-500"
                        onError={() => setImageError(true)}
                        priority={false}
                        loading="lazy"
                        quality={75}
                      />
                    </div>
                  )}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {rev.userName}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      পেশাঃ {rev.profession}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="px-3 py-1 text-sm rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    Approved
                  </span>
                </div>
              </div>

              {/* Review Content */}
              <div className="relative bg-gradient-to-br from-amber-50 to-amber-100 dark:from-gray-700 dark:to-gray-800 rounded-2xl p-6 mb-4">
                <div className="absolute -top-3 left-6 text-4xl text-amber-200 dark:text-gray-600">
                  "
                </div>
                <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed relative z-10">
                  {rev.reviewText}
                </p>
                <div className="absolute -bottom-3 right-6 text-4xl text-amber-200 dark:text-gray-600">
                  "
                </div>
              </div>

              {/* Footer Section */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(rev.createdAt).toLocaleDateString("bn-BD", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                  <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                    <span className="font-medium">
                      পছন্দঃ {rev.likes.length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Dots */}
      {length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {reviews.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                clearInterval(timerRef.current);
                setCurrent(index);
              }}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                current === index
                  ? "bg-teal-500 w-4"
                  : "bg-gray-300 dark:bg-gray-600"
              }`}
              aria-label={`Go to review ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Prev/Next buttons */}
      {length > 1 && (
        <>
          <button
            onClick={() => {
              clearInterval(timerRef.current);
              prev();
            }}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors opacity-50 hover:opacity-100"
            aria-label="Previous review"
          >
            <FiChevronLeft
              size={24}
              className="text-gray-600 dark:text-gray-300"
            />
          </button>
          <button
            onClick={() => {
              clearInterval(timerRef.current);
              next();
            }}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors  opacity-50 hover:opacity-100"
            aria-label="Next review"
          >
            <FiChevronRight
              size={24}
              className="text-gray-600 dark:text-gray-300"
            />
          </button>
        </>
      )}
    </div>
  );
}
