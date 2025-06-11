export default function MasalahSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 animate-pulse"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="flex-1">
              {/* Title skeleton */}
              <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>

              {/* Description skeleton */}
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
              </div>

              {/* Categories skeleton */}
              <div className="mt-4 flex flex-wrap gap-2">
                {[1, 2].map((cat) => (
                  <div
                    key={cat}
                    className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-20"
                  ></div>
                ))}
              </div>
            </div>

            {/* Actions skeleton */}
            <div className="flex flex-col items-end gap-2">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-6"></div>
            </div>
          </div>

          {/* Footer skeleton */}
          <div className="mt-4 flex items-center justify-between">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function MasalahDetailSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header skeleton */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8 animate-pulse">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            {/* Title skeleton */}
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>

            {/* Categories skeleton */}
            <div className="flex flex-wrap gap-2 mb-4">
              {[1, 2, 3].map((cat) => (
                <div
                  key={cat}
                  className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-24"
                ></div>
              ))}
            </div>
          </div>

          {/* Actions skeleton */}
          <div className="flex gap-4">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-6"></div>
          </div>
        </div>

        {/* Content skeleton */}
        <div className="mt-6 space-y-4">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
          </div>

          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mt-8"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
          </div>
        </div>

        {/* Footer skeleton */}
        <div className="mt-6 space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-40"></div>
        </div>
      </div>

      {/* Comments section skeleton */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>

        {/* Comment form skeleton */}
        <div className="mb-6">
          <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
        </div>

        {/* Comments list skeleton */}
        <div className="space-y-6">
          {[1, 2].map((comment) => (
            <div key={comment} className="border-b pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
              </div>
              <div className="flex items-center gap-4 mt-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
