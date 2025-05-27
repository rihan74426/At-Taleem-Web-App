"use client";

import Image from "next/image";
import { useState } from "react";
import Link from "next/link";

export default function BookCard({ book }) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  return (
    <Link href={`/published-books/${book._id}`}>
      <div className="group bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300">
        {/* Cover Image */}
        <div className="relative aspect-[3/4] overflow-hidden">
          {!imageError ? (
            <Image
              src={book.coverImage}
              alt={book.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className={`
                object-cover transition-transform duration-300 group-hover:scale-105
                ${isLoading ? "blur-sm grayscale" : "blur-0 grayscale-0"}
              `}
              onLoadingComplete={() => setIsLoading(false)}
              onError={() => setImageError(true)}
              priority={false}
              quality={75}
            />
          ) : (
            <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <span className="text-gray-500 dark:text-gray-400">No Image</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 line-clamp-2">
            {book.title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {book.author}
          </p>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {book.price} BDT
            </span>
            <div className="flex gap-1">
              {book.categories?.slice(0, 2).map((category) => (
                <span
                  key={category._id}
                  className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full"
                >
                  {category.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
