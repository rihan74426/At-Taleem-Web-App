"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import ReactPlayer from "react-player";

export default function VideosPage() {
  const [videos, setVideos] = useState([]);
  const [viewMode, setViewMode] = useState("card"); // "card" or "list"
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    async function fetchVideos() {
      const res = await fetch(`/api/videos?page=${currentPage}`);
      if (res.ok) {
        const { videos, totalPages, currentPage } = await res.json();
        setVideos(videos);
        setTotalPages(totalPages);
        setCurrentPage(currentPage);
      }
    }
    fetchVideos();
  }, [currentPage]);

  // Video card: shows thumbnail instead of iframe.
  function VideoCard({ video }) {
    return (
      <div className="border p-4 rounded shadow-md hover:shadow-lg transition duration-300">
        <h3 className="font-bold mb-2">{video.title}</h3>
        <div className="relative w-60 h-40">
          {/* If embedCode exists, display an actual thumbnail from video.videoUrl (or any real thumbnail URL).
          Otherwise, show a default fallback image from /public. */}
          {video.embedCode ? (
            <ReactPlayer url={video.videoUrl} width="100%" height="100%" />
          ) : (
            <Image
              src="/thumbnail.png" // <-- Your default image in /public/images
              alt={video.title}
              fill
              className="blur-sm rounded object-cover"
            />
          )}

          {/* Overlay text with colored background */}
          <div className="absolute inset-0 flex items-center justify-center p-2">
            <div className="bg-green-600 bg-opacity-80 text-white text-center px-2 py-1 rounded-lg">
              {video.title}
            </div>
          </div>
        </div>
        <p className="text-sm text-gray-500">
          {new Date(video.createdAt).toLocaleDateString()}
        </p>
      </div>
    );
  }

  // Video list item for list view: similar but simplified.
  function VideoListItem({ video }) {
    return (
      <div className="flex gap-4 border-b p-2">
        <div className="relative w-40 h-24">
          {/* If embedCode exists, display an actual thumbnail from video.videoUrl (or any real thumbnail URL).
          Otherwise, show a default fallback image from /public. */}
          {video.embedCode ? (
            <ReactPlayer url={video.videoUrl} width="100%" height="100%" />
          ) : (
            <Image
              src="/thumbnail.png" // <-- Your default image in /public/images
              alt={video.title}
              objectFit
              className="rounded object-cover"
            />
          )}

          {/* Overlay text with colored background */}
          <div className="absolute inset-0 flex items-center justify-center p-2">
            <div className="bg-green-600 bg-opacity-80 text-white text-center px-2 py-1 rounded-lg">
              {video.title}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 min-h-screen">
      <h1 className="text-3xl text-center font-bold mb-4">Taleem Videos</h1>
      <div className="flex justify-between mb-4">
        <div>
          <button
            onClick={() => setViewMode("card")}
            className={`px-4 py-2 border ${
              viewMode === "card" ? "bg-blue-500 text-white" : "text-blue-500"
            }`}
          >
            Card View
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`ml-2 px-4 py-2 border ${
              viewMode === "list" ? "bg-blue-500 text-white" : "text-blue-500"
            }`}
          >
            List View
          </button>
        </div>
      </div>
      <div className="grid gap-4">
        {viewMode === "card" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.map((video) => (
              <Link key={video._id} href={`/taleem-videos/${video._id}`}>
                <VideoCard video={video} />
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col">
            {videos.map((video) => (
              <Link key={video._id} href={`/taleem-videos/${video._id}`}>
                <VideoListItem video={video} />
              </Link>
            ))}
          </div>
        )}
      </div>
      {/* Pagination Controls */}
      <div className="mt-4 flex justify-center gap-2">
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i}
            onClick={() => setCurrentPage(i + 1)}
            className={`px-3 py-1 border ${
              currentPage === i + 1 ? "bg-blue-500 text-white" : "text-blue-500"
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
