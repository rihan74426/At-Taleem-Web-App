"use client";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  FiBook,
  FiCalendar,
  FiVideo,
  FiHelpCircle,
  FiMapPin,
} from "react-icons/fi";

const getIcon = (type) => {
  switch (type) {
    case "book":
      return <FiBook className="w-4 h-4" />;
    case "event":
      return <FiCalendar className="w-4 h-4" />;
    case "video":
      return <FiVideo className="w-4 h-4" />;
    case "question":
      return <FiHelpCircle className="w-4 h-4" />;
    case "institution":
      return <FiMapPin className="w-4 h-4" />;
    default:
      return null;
  }
};

const getTypeLabel = (type) => {
  switch (type) {
    case "book":
      return "বই";
    case "event":
      return "কর্মসূচী";
    case "video":
      return "ভিডিও";
    case "question":
      return "প্রশ্নোত্তর";
    case "institution":
      return "প্রতিষ্ঠান";
    default:
      return type;
  }
};

export default function SearchSuggestions({
  results,
  isOpen,
  onClose,
  onSelect,
  searchTerm,
}) {
  const router = useRouter();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef(null);

  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < results.length - 1 ? prev + 1 : prev
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
          break;
        case "Enter":
          e.preventDefault();
          if (results[selectedIndex]) {
            handleSelect(results[selectedIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, results, selectedIndex, onClose]);

  const handleSelect = (result) => {
    onSelect(result);
    router.push(result.route);
  };

  if (!isOpen || !results.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto z-50"
      ref={containerRef}
    >
      <div className="p-2">
        {results.map((result, index) => {
          const title = result.title || result.name || result.question;
          const description = result.description || result.answer || "";
          const isSelected = index === selectedIndex;

          return (
            <motion.div
              key={`${result.type}-${result._id}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`p-2 rounded-lg cursor-pointer ${
                isSelected
                  ? "bg-teal-50 dark:bg-teal-900/20"
                  : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
              }`}
              onClick={() => handleSelect(result)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className="flex items-start gap-3">
                <div className="mt-1 text-gray-500 dark:text-gray-400">
                  {getIcon(result.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {title}
                    </p>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {getTypeLabel(result.type)}
                    </span>
                  </div>
                  {description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                      {description}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
