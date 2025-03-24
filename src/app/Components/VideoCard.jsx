"use client";
import Link from "next/link";
import Image from "next/image";
import { FiMoreVertical } from "react-icons/fi"; // More options icon
import { useState } from "react";

export function VideoCard({ video, onEdit, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="relative border p-4 rounded shadow-md hover:shadow-lg transition duration-300">
      {/* Options button in top right */}
      <div
        className="absolute top-2 right-2"
        onMouseEnter={() => setMenuOpen((prev) => !prev)}
        onMouseLeave={() => setMenuOpen(false)}
      >
        <button
          onClick={() => setMenuOpen((prev) => !prev)}
          className="text-gray-600 hover:text-gray-900"
        >
          <FiMoreVertical size={20} />
        </button>
        {menuOpen && (
          <div className="absolute right-0 w-32 dark:bg-slate-900 dark:text-white text-black bg-white border rounded shadow-md z-10">
            <button
              onClick={() => {
                setMenuOpen(false);
                onEdit(video);
              }}
              className="block w-full text-left px-3 py-2 hover:bg-blue-500"
            >
              Edit
            </button>
            <button
              onClick={() => {
                setMenuOpen(false);
                onDelete(video._id);
              }}
              className="block w-full text-left px-3 py-2 hover:bg-red-500"
            >
              Delete
            </button>
          </div>
        )}
      </div>
      <Link
        key={video._id}
        href={`/${video.category.toLowerCase()}-videos/${video._id}`}
      >
        <h3 className="font-bold mb-2">{video.title}</h3>
        <div className="relative w-full h-36">
          <Image
            src="/thumbnail.png" // Your default thumbnail image
            alt={video.title}
            fill
            className="rounded object-cover blur-sm"
          />
          <div className="absolute inset-0 flex items-center justify-center p-2">
            <div className="bg-green-800 bg-opacity-80 text-white text-center px-2 py-1 rounded-lg">
              {video.title}
            </div>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          {video.recordingDate ? "Recorded: " : "Post Created: "}
          {new Date(
            video.recordingDate || video.createdAt
          ).toLocaleDateString()}
        </p>
      </Link>
    </div>
  );
}
