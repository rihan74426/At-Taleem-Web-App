"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiCheckCircle, FiXCircle } from "react-icons/fi";

export default function ResponseModal({ message, status, isOpen, onClose }) {
  // Auto-close after 3 seconds
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        // Container that animates in/out
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 50 }}
          transition={{ duration: 0.3 }}
          className="fixed top-5 right-5 z-50"
        >
          {/* Toast box */}
          <div
            className={`max-w-sm w-full ${
              status === "success" ? "bg-green-600" : "bg-red-600"
            } text-white rounded-lg shadow-lg overflow-hidden`}
          >
            {/* Icon + message + close button */}
            <div className="flex items-center p-4">
              {status === "success" ? (
                <FiCheckCircle className="text-2xl mr-2" />
              ) : (
                <FiXCircle className="text-2xl mr-2" />
              )}
              <p className="flex-1">{message}</p>
              <button onClick={onClose} className="text-white text-xl">
                &times;
              </button>
            </div>
            {/* Progress bar that shrinks over 3s */}
            <div className="h-1 bg-white/50">
              <motion.div
                className="h-full bg-white"
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 3, ease: "linear" }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
