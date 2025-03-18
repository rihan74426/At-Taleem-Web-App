"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import ReactPlayer from "react-player";
import { useUser } from "@clerk/nextjs";
import { BsCardText, BsList } from "react-icons/bs";
import AdminVideosPage from "../dashboard/videos/page";
import { Modal } from "flowbite-react";

export default function VideosPage() {
  const [videos, setVideos] = useState([]);
  const [viewMode, setViewMode] = useState("card"); // "card" or "list"
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [videoModal, setVideoModal] = useState(false);

  const user = useUser();

  useEffect(() => {
    async function fetchVideos() {
      let url = `/api/videos?page=${currentPage}&category=Juma`;

      const res = await fetch(url);
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
        <div className="relative  w-50 h-36 ">
          <Image
            src="/thumbnail.png" // <-- Your default image in /public/images
            alt={video.title}
            fill
            className="blur-sm rounded object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center p-2">
            <div className="bg-green-800 bg-opacity-80 text-white text-center px-2 py-1 rounded-lg">
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
          {video?.platform === "YouTube" ? (
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
            <div className="bg-green-600 bg-opacity-80 text-sm text-white text-center px-2 py-1 rounded-lg">
              {video.title}
            </div>
          </div>
        </div>
        <div>
          <h3 className="font-bold mb-2">{video.title}</h3>
          <p className="text-sm text-gray-500">
            {new Date(video.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl flex flex-col mx-auto p-4 min-h-screen">
      <h1 className="text-3xl text-center font-bold mb-4" id="main-container">
        Juma Videos
      </h1>
      <div className="flex justify-between mb-4">
        <div>
          <button
            onClick={() => setViewMode("card")}
            className={`px-4 py-2 border rounded-xl hover:bg-blue-200 ${
              viewMode === "card" ? "bg-blue-500 text-white" : "text-blue-500"
            }`}
          >
            <BsCardText />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`ml-2 px-4 py-2 border rounded-xl hover:bg-blue-200 ${
              viewMode === "list" ? "bg-blue-500 text-white" : "text-blue-500"
            }`}
          >
            <BsList />
          </button>
        </div>
        {user.isSignedIn && user.user.publicMetadata.isAdmin && (
          <button
            // href={"dashboard/videos"}
            onClick={() => setVideoModal(true)}
            className={`ml-2 px-4 py-2 border rounded-3xl place-content-end  hover:bg-blue-200 ${
              viewMode === "list" ? "bg-blue-500 text-white" : "text-blue-500"
            }`}
          >
            Add New Video
          </button>
        )}
      </div>
      <div className="grid gap-4 mb-5">
        {viewMode === "card" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {videos.map((video) => (
              <Link key={video._id} href={`/juma-videos/${video._id}`}>
                <VideoCard video={video} />
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col">
            {videos.map((video) => (
              <Link key={video._id} href={`/juma-videos/${video._id}`}>
                <VideoListItem video={video} />
              </Link>
            ))}
          </div>
        )}
      </div>
      {/* Pagination Controls */}
      <div className=" flex mt-auto justify-center gap-2">
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i}
            onClick={() => {
              setCurrentPage(i + 1);
              document.body.scrollTop = document.documentElement.scrollTop = 0;
            }}
            className={`px-3 py-1 border ${
              currentPage === i + 1 ? "bg-blue-500 text-white" : "text-blue-500"
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>
      {/* {videoModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className="bg-black/50 absolute inset-0"
            onClick={() => setVideoModal(false)}
          ></div>
          <div className="relative bg-slate-200 dark:bg-gray-600 p-10 rounded-lg shadow-lg">
            <AdminVideosPage />
          </div>
        </div>
      )} */}
      <Modal
        show={videoModal}
        size="lg"
        popup
        onClose={() => setVideoModal(false)}
      >
        <Modal.Header></Modal.Header>
        <Modal.Body>
          <AdminVideosPage />
        </Modal.Body>
      </Modal>
    </div>
  );
}
