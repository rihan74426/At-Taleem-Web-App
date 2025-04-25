"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { BsCardText, BsList } from "react-icons/bs";
import AdminVideosPage from "../dashboard/videos/page"; // The modal content for editing/adding
import { Modal } from "flowbite-react";
import { VideoCard } from "../Components/VideoCard";
import { VideoListItem } from "../Components/VideoList";
import ResponseModal from "../Components/ResponseModal";
import Loader from "../Components/Loader";

export default function VideosPage() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("card"); // "card" or "list"
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [videoModal, setVideoModal] = useState(false);
  const [editingVideo, setEditingVideo] = useState(null);
  const user = useUser();
  const [modal, setModal] = useState({
    isOpen: false,
    message: "",
    status: "",
  });
  const showModal = (message, status) => {
    setModal({ isOpen: true, message, status });
  };

  // Callbacks for edit and delete actions
  const handleEdit = (video) => {
    setEditingVideo(video);
    setVideoModal(true); // Open modal for editing
  };
  const onUpdate = (newVideo) => {
    setVideos((prev) =>
      prev.map((v) => (v._id === newVideo._id ? newVideo : v))
    );
  };

  useEffect(() => {
    async function fetchVideos() {
      let url = `/api/videos?page=${currentPage}&category=Taleem`;
      const res = await fetch(url);
      if (res.ok) {
        const { videos, totalPages, currentPage } = await res.json();
        setVideos(videos);
        setTotalPages(totalPages);
        setCurrentPage(currentPage);
      }
      setLoading(false);
    }
    fetchVideos();
  }, [currentPage]);
  const handleDelete = async (videoId) => {
    if (!user?.user.publicMetadata?.isAdmin) {
      modal.isOpen = true;
      showModal(
        "You have to be an Admin to change anything restricted",
        "error"
      );
    } else {
      if (!window.confirm("Are you sure you want to delete this video?"))
        return;
      const res = await fetch(`/api/videos/${videoId}`, { method: "DELETE" });
      if (res.ok) {
        setVideos((prev) => prev.filter((v) => v._id !== videoId));
      }
    }
  };

  return (
    <div className="max-w-6xl flex flex-col mx-auto p-4 min-h-screen">
      <h1 className="text-3xl text-center font-bold mb-4" id="main-container">
        Taleem Videos
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
        <button
          onClick={() => {
            setEditingVideo(null);
            setVideoModal(true);
          }}
          className="ml-2 px-4 py-2 border rounded-3xl hover:bg-blue-200 dark:hover:bg-blue-900 dark:bg-gray-800"
        >
          Add New Video
        </button>
      </div>
      {loading && (
        <div className="flex items-center place-content-center">
          <Loader />
        </div>
      )}
      {viewMode === "card" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-5">
          {videos.map((video) => (
            <VideoCard
              key={video._id}
              video={video}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col mb-5">
          {videos.map((video) => (
            <VideoListItem
              key={video._id}
              video={video}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
      {/* Pagination Controls */}
      <div className="flex mt-auto justify-center gap-2">
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i}
            onClick={() => {
              setCurrentPage(i + 1);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className={`px-3 py-1 border ${
              currentPage === i + 1 ? "bg-blue-500 text-white" : "text-blue-500"
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* Modal for Add/Edit Video */}
      {videoModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className="bg-black/80 absolute inset-0"
            onClick={() => setVideoModal(false)}
          ></div>
          <div className="relative bg-slate-500 h-5/6 p-5 overflow-auto sm:w-2/3 w-full lg:w-1/3 dark:bg-gray-600 rounded-lg shadow-lg m-5">
            <button
              className="ml-auto absolute right-5 top-2 items-center rounded-lg bg-transparent p-1.5 text-sm text-gray-400 hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-gray-400 dark:hover:text-white"
              onClick={() => setVideoModal(false)}
              title="Close"
            >
              <svg
                stroke="currentColor"
                fill="none"
                strokeWidth="2"
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                ></path>
              </svg>
            </button>
            <div className="mt-5">
              <AdminVideosPage
                initialVideo={editingVideo}
                onUpdate={onUpdate}
                onClose={() => setVideoModal(false)}
              />
            </div>
          </div>
        </div>
      )}
      <ResponseModal
        isOpen={modal.isOpen}
        message={modal.message}
        status={modal.status}
        onClose={() => setModal({ ...modal, isOpen: false })}
      />
    </div>
  );
}
