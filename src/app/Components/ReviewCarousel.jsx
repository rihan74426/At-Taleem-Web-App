"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import Loader from "../Components/Loader";
import { ReviewCard } from "../about-us/page";
import Image from "next/image";

export default function ReviewCarousel({ reviews }) {
  const [current, setCurrent] = useState(0);
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

  return (
    <div className="relative w-full overflow-hidden">
      {" "}
      <AnimatePresence mode="wait">
        <motion.div
          key={rev._id}
          className="relative inset-0 "
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -300, opacity: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div
            key={rev._id}
            className="relative bg-amber-100 dark:bg-[#0B192C]  border rounded-lg overflow-hidden"
            style={{ borderBottomRightRadius: "50%", minHeight: 200 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 min-h-[500px] items-center">
              <div className="col-span-1 md:col-span-4 space-y-3">
                <div className="flex sm:items-center sm:space-x-2">
                  <h3 className="text-2xl m-2 font-bold">{rev.userName}</h3>
                  <span className="text-sm m-2 text-gray-700 dark:text-gray-300">
                    (পেশাঃ {rev.profession})
                  </span>

                  <span className="">পছন্দঃ {rev.likes.length}</span>
                </div>
                <p className="italic text-justify whitespace-pre-wrap">
                  “{rev.reviewText}”
                </p>
              </div>

              {/* Sidebar spans full width on sm, 1 col on md */}
              <div className="col-span-1 flex flex-col items-center  space-y-3">
                {rev.userProfilePic ? (
                  <Image
                    src={rev.userProfilePic}
                    width={100}
                    height={100}
                    className="rounded-full"
                    alt={rev.userName}
                  />
                ) : (
                  <div className="w-24 h-24 border rounded-full flex items-center justify-center">
                    ছবি নেই
                  </div>
                )}

                <p className="text-xs text-gray-500">
                  Date: {new Date(rev.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
      {/* Prev/Next buttons */}
      <button
        onClick={() => {
          clearInterval(timerRef.current);
          prev();
        }}
        className="absolute left-2 top-1/2 transform -translate-y-1/2 p-2 bg-gray-500 bg-opacity-50 rounded-full hover:bg-opacity-90"
        aria-label="Previous review"
      >
        <FiChevronLeft size={24} />
      </button>
      <button
        onClick={() => {
          clearInterval(timerRef.current);
          next();
        }}
        className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-gray-500 bg-opacity-50 rounded-full hover:bg-opacity-90"
        aria-label="Next review"
      >
        <FiChevronRight size={24} />
      </button>
    </div>
  );
}
