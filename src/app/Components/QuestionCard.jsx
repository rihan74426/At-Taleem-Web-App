import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { HiOutlinePencil, HiOutlineTrash } from "react-icons/hi";
import { FaBookmark, FaRegBookmark } from "react-icons/fa";
import { BsHandThumbsUp, BsHandThumbsUpFill } from "react-icons/bs";
import { FiShare2 } from "react-icons/fi";
import { formatDistanceToNow } from "date-fns";
import { bn } from "date-fns/locale";

export default function QuestionCard({
  question,
  categories,
  isSignedIn,
  user,
  onEdit,
  onDelete,
  onBookmark,
  onHelpful,
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const hasVoted = isSignedIn && question?.helpfulVotes?.includes(user?.id);
  const isBookmarked = isSignedIn && question?.bookmarks?.includes(user?.id);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: question.title,
          text: question.description,
          url: window.location.href,
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  const handleHelpful = async () => {
    if (!isSignedIn) {
      alert("Please sign in to vote");
      return;
    }
    if (question.status !== "answered") {
      alert("You can only vote after the question is answered");
      return;
    }
    setIsLoading(true);
    try {
      await onHelpful(question._id);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookmark = async () => {
    if (!isSignedIn) {
      alert("Please sign in to bookmark");
      return;
    }
    setIsLoading(true);
    try {
      await onBookmark(question._id);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transition-all duration-300 flex flex-col h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="p-6 flex flex-col flex-grow">
        {/* Question Header */}
        <Link href={`/questionnaires/${question._id}`} className="flex-grow">
          <motion.h2
            whileHover={{ color: "#2563eb" }}
            className="text-xl font-semibold text-gray-900 dark:text-white mb-3 line-clamp-2"
          >
            {question.title}
          </motion.h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3 min-h-[4.5rem]">
            {question.description || "No description provided"}
          </p>

          {/* Category Tags */}
          <div className="flex flex-wrap gap-2 mb-4 min-h-[2rem]">
            <AnimatePresence>
              {question.category?.map((cat) => (
                <motion.span
                  key={cat._id}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="px-3 py-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full text-sm font-medium shadow-sm hover:shadow-md transition-shadow"
                >
                  {cat.name}
                </motion.span>
              ))}
            </AnimatePresence>
          </div>

          {/* Question Meta */}
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
            <div className="flex items-center space-x-4">
              <motion.span
                whileHover={{ scale: 1.05 }}
                className={`px-3 py-1 rounded-full ${
                  question.status === "answered"
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                    : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
                }`}
              >
                {question.status === "answered"
                  ? "উত্তর হয়েছে"
                  : "উত্তর হয়নি"}
              </motion.span>
              <span className="flex items-center">
                <span className="mr-1">প্রশ্নকারী:</span>
                {question.isAnonymous ? "অজ্ঞাতনামা" : question.username}
              </span>
            </div>
            <span className="text-sm whitespace-nowrap">
              {formatDistanceToNow(new Date(question.createdAt), {
                addSuffix: true,
                locale: bn,
              })}
            </span>
          </div>
        </Link>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700 mt-auto">
          <div className="flex items-center space-x-4">
            <motion.button
              whileHover={{ scale: question.status === "answered" ? 1.05 : 1 }}
              whileTap={{ scale: question.status === "answered" ? 0.95 : 1 }}
              onClick={handleHelpful}
              disabled={isLoading || question.status !== "answered"}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-full transition-colors ${
                question.status !== "answered"
                  ? "bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed"
                  : hasVoted
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                  : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
              title={
                question.status !== "answered"
                  ? "Wait for the answer to vote"
                  : "Mark as helpful"
              }
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : hasVoted ? (
                <BsHandThumbsUpFill className="w-4 h-4" />
              ) : (
                <BsHandThumbsUp className="w-4 h-4" />
              )}
              <span>{question.helpfulVotes?.length || 0}</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleBookmark}
              disabled={isLoading}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-full transition-colors ${
                isBookmarked
                  ? "text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20"
                  : "text-gray-500 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
              }`}
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : isBookmarked ? (
                <FaBookmark className="w-4 h-4" />
              ) : (
                <FaRegBookmark className="w-4 h-4" />
              )}
              <span>{question.bookmarks?.length || 0}</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleShare}
              className="p-1.5 text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors"
            >
              <FiShare2 className="w-4 h-4" />
            </motion.button>
          </div>

          {/* Edit & Delete Buttons */}
          {((isSignedIn && user?.id === question.userId) ||
            (user?.publicMetadata?.isAdmin &&
              question.status === "pending")) && (
            <div className="flex items-center space-x-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onEdit(question)}
                className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors"
              >
                <HiOutlinePencil className="w-4 h-4" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onDelete(question)}
                className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
              >
                <HiOutlineTrash className="w-4 h-4" />
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
