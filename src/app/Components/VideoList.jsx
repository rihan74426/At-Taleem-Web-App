"use client";
import Link from "next/link";
import Image from "next/image";
import { FiMoreVertical } from "react-icons/fi";
import { useState } from "react";
import ReactPlayer from "react-player";

export function VideoListItem({ video, onEdit, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div key={video._id} className="relative flex gap-4 border-b p-2">
      <div className="relative w-40 h-24">
        <Link
          key={video._id}
          href={`/${video.category.toLowerCase()}-videos/${video._id}`}
        >
          {video.platform === "YouTube" ? (
            <ReactPlayer url={video.videoUrl} width="100%" height="100%" />
          ) : (
            <Image
              src="/thumbnail.png" // Default thumbnail
              alt={video.title}
              fill
              className="rounded object-cover blur-sm"
            />
          )}
          <div className="absolute inset-0 flex items-center justify-center p-2">
            <div className="bg-green-600 bg-opacity-80 text-sm text-white text-center px-2 py-1 rounded-lg">
              {video.title}
            </div>
          </div>
        </Link>
      </div>
      <div className="flex-1">
        <Link
          key={video._id}
          href={`/${video.category.toLowerCase()}-videos/${video._id}`}
        >
          <h3 className="font-bold mb-2">{video.title}</h3>
          <p className="text-sm text-gray-500">
            {video.recordingDate ? "Recorded: " : "Post Created: "}
            {new Date(
              video.recordingDate || video.createdAt
            ).toLocaleDateString()}
          </p>
        </Link>
      </div>
      {/* Options button */}
      <div
        className="relative"
        onMouseEnter={() => setMenuOpen((prev) => !prev)}
        onMouseLeave={() => setMenuOpen(false)}
      >
        <button
          onClick={() => setMenuOpen(!menuOpen)}
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
    </div>
  );
}
