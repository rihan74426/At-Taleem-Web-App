export default function BookSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
        {/* Cover Image Skeleton */}
        <div className="aspect-[3/4] bg-gray-300 dark:bg-gray-600" />

        {/* Content Skeleton */}
        <div className="p-4 space-y-3">
          {/* Title Skeleton */}
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4" />

          {/* Author Skeleton */}
          <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2" />

          {/* Price Skeleton */}
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/4" />

          {/* Categories Skeleton */}
          <div className="flex gap-2">
            <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-20" />
            <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-20" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function BookGridSkeleton({ count = 12 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <BookSkeleton key={index} />
      ))}
    </div>
  );
}
