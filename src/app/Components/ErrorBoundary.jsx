"use client";

import { useState } from "react";

export function ErrorBoundary({ children }) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className="text-center p-4">
        <h2 className="text-red-600 text-xl font-semibold mb-2">
          কিছু সমস্যা হয়েছে
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          দয়া করে পেজটি রিফ্রেশ করে আবার চেষ্টা করুন
        </p>
        <button
          onClick={() => setHasError(false)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
        >
          আবার চেষ্টা করুন
        </button>
      </div>
    );
  }

  return children;
}
