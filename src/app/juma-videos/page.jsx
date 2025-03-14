"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { slugify } from "transliteration";

// VideoCard component (unchanged)
function VideoCard({ video }) {
  return (
    <div className="border p-4 rounded shadow-md ">
      <div className="mt-2 aspect-video relative">
        <div
          className="w-full h-full"
          dangerouslySetInnerHTML={{
            __html:
              video.platform === "YouTube" ? video.embedCode : video.videoUrl,
          }}
        />
      </div>
      <h3 className="font-bold">{video.title}</h3>
      <p className="mt-2 text-sm text-gray-500">
        {new Date(video.createdAt).toLocaleDateString()}
      </p>
    </div>
  );
}

// VideoListItem component (unchanged)
function VideoListItem({ video }) {
  return (
    <div className="flex gap-4 border-b p-2">
      <div className="w-40 aspect-video relative">
        <div
          className="w-full h-full"
          dangerouslySetInnerHTML={{
            __html:
              video.platform === "YouTube" ? video.embedCode : video.videoUrl,
          }}
        />
      </div>
      <div>
        <h3 className="font-bold">{video.title}</h3>
        <p className="text-sm text-gray-500">
          {new Date(video.createdAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}

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

  return (
    <div className="max-w-6xl mx-auto p-4 min-h-screen">
      <h1 className="text-3xl text-center font-bold mb-4">Juma Videos</h1>
      <div className="flex justify-between mb-4">
        <div>
          <button
            onClick={() => setViewMode("card")}
            className={`px-4 py-2 border ${
              viewMode === "card" ? "bg-blue-500 text-white" : ""
            }`}
          >
            Card View
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`ml-2 px-4 py-2 border ${
              viewMode === "list" ? "bg-blue-500 text-white" : ""
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
              // Wrap the VideoCard in a Link to the video detail page
              <Link
                key={video._id}
                href={`/juma-videos/${video._id}`}
                onClick={() => console.log(video._id)}
              >
                <VideoCard video={video} />
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col">
            {videos.map((video) => (
              // Wrap the VideoListItem in a Link
              <Link key={video._id} href={`/juma-videos/${video._id}`}>
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
              currentPage === i + 1 ? "bg-blue-500 text-white" : ""
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
