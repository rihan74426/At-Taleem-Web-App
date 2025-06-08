import { motion } from "framer-motion";

export function QuestionCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-6 border border-gray-100 dark:border-gray-700">
      {/* Title */}
      <div className="space-y-3">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-lg w-3/4 animate-pulse" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-1/2 animate-pulse" />
      </div>

      {/* Description */}
      <div className="mt-4 space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-full animate-pulse" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-5/6 animate-pulse" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-4/6 animate-pulse" />
      </div>

      {/* Categories */}
      <div className="mt-4 flex flex-wrap gap-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-20 animate-pulse"
          />
        ))}
      </div>

      {/* Meta Info */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-24 animate-pulse" />
        </div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-32 animate-pulse" />
      </div>

      {/* Action Buttons */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg w-24 animate-pulse" />
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg w-24 animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
          <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export function QuestionDetailSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Question Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
        <div className="space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg w-3/4 animate-pulse" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-1/2 animate-pulse" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-full animate-pulse" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-5/6 animate-pulse" />
        </div>

        {/* Categories */}
        <div className="mt-4 flex flex-wrap gap-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-20 animate-pulse"
            />
          ))}
        </div>

        {/* Meta Info */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-24 animate-pulse" />
          </div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-32 animate-pulse" />
        </div>
      </div>

      {/* Answer Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
        <div className="space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-lg w-1/4 animate-pulse" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-full animate-pulse" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-full animate-pulse" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-5/6 animate-pulse" />
        </div>

        {/* Meta Info */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-24 animate-pulse" />
          </div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-32 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
