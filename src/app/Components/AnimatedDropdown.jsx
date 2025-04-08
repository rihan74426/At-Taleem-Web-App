// components/AnimatedDropdown.jsx
"use client";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { FiChevronDown } from "react-icons/fi";
import { useState, useEffect } from "react";

export default function AnimatedDropdown({ title, id, items }) {
  const [isOpen, setIsOpen] = useState(false);
  const [left, setLeft] = useState(0);

  useEffect(() => {
    if (isOpen) {
      const tab = document.getElementById(`tab-${id}`);
      const tabRect = tab?.getBoundingClientRect();
      if (tabRect) {
        const tabCenter = tabRect.left + tabRect.width / 2;
        setLeft(tabCenter);
      }
    }
  }, [isOpen]);

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        id={`tab-${id}`}
        className="flex py-2 pl-3 pr-4 md:p-0 border-b border-gray-100 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white md:border-0 md:hover:bg-transparent md:hover:text-cyan-700 md:dark:hover:bg-transparent md:dark:hover:text-white"
      >
        {title + " "}
        <FiChevronDown
          className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute left-1/2 top-full z-50 w-56 -translate-x-1/2 rounded-md border border-gray-300 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900"
          >
            <div className="p-3">
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  {item.label}
                </Link>
              ))}
            </div>
            {/* Nub */}
            <motion.span
              animate={{ left }}
              transition={{ duration: 0.2 }}
              className="absolute top-0 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rotate-45 border-l border-t border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
