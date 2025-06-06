"use client";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { BsCardText, BsList, BsSearch, BsFilter, BsX } from "react-icons/bs";
import AdminVideosPage from "../dashboard/videos/page";
import { VideoCard } from "./VideoCard";
import { VideoListItem } from "./VideoList";
import { VideoCardSkeleton, VideoListSkeleton } from "./VideoSkeleton";
import ResponseModal from "./ResponseModal";
import { toast } from "react-hot-toast";

export default function VideoListing({ category, title }) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("card");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [videoModal, setVideoModal] = useState(false);
  const [editingVideo, setEditingVideo] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("recordingDate");
  const [sortOrder, setSortOrder] = useState("desc");
  const [showFilters, setShowFilters] = useState(false);
  const { user, isLoaded: isUserLoaded } = useUser();

  const [modal, setModal] = useState({
    isOpen: false,
    message: "",
    status: "",
  });

  const showModal = (message, status) => {
    setModal({ isOpen: true, message, status });
  };

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: currentPage,
        category,
        search: searchQuery,
        sort: sortBy,
        order: sortOrder,
      });

      const res = await fetch(`/api/videos?${queryParams}`);
      if (!res.ok) throw new Error("Failed to fetch videos");

      const data = await res.json();
      setVideos(data.videos);
      setTotalPages(data.pagination.totalPages);
      setCurrentPage(data.pagination.page);
    } catch (error) {
      console.error("Error fetching videos:", error);
      toast.error("Failed to load videos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, [currentPage, searchQuery, sortBy, sortOrder]);

  const handleEdit = (video) => {
    if (!user?.publicMetadata?.isAdmin) {
      showModal("You need to be an admin to edit videos", "error");
      return;
    }
    setEditingVideo(video);
    setVideoModal(true);
  };

  const handleDelete = async (videoId) => {
    if (!user?.publicMetadata?.isAdmin) {
      showModal("You need to be an admin to delete videos", "error");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this video?")) return;

    try {
      const res = await fetch(`/api/videos/${videoId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete video");

      setVideos((prev) => prev.filter((v) => v._id !== videoId));
      toast.success("Video deleted successfully");
    } catch (error) {
      console.error("Error deleting video:", error);
      toast.error("Failed to delete video");
    }
  };

  const handleUpdateVideo = (updatedVideo) => {
    setVideos((prev) =>
      prev.map((v) => (v._id === updatedVideo._id ? updatedVideo : v))
    );
    setVideoModal(false);
    toast.success("Video updated successfully");
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page on new search
  };

  const renderSkeletons = () => {
    const count = 8; // Number of skeleton items to show
    return viewMode === "card" ? (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
        {Array.from({ length: count }).map((_, i) => (
          <VideoCardSkeleton key={i} />
        ))}
      </div>
    ) : (
      <div className="flex flex-col gap-4 mb-8">
        {Array.from({ length: count }).map((_, i) => (
          <VideoListSkeleton key={i} />
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-6xl flex flex-col mx-auto p-4 min-h-screen">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
        <h1 className="text-3xl text-center font-bold mb-6">{title}</h1>

        {/* Search and Filter Bar */}
        <div className="flex flex-col gap-4">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search videos..."
              className="w-full px-4 py-3 pl-12 pr-4 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 dark:bg-gray-700"
            />
            <BsSearch className="absolute left-4 top-4 text-gray-400" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
              >
                <BsX size={20} />
              </button>
            )}
          </form>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 border rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <BsFilter />
                <span>Filters</span>
              </button>

              {showFilters && (
                <div className="flex items-center gap-4">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-700"
                  >
                    <option value="recordingDate">Date</option>
                    <option value="views">Views</option>
                    <option value="title">Title</option>
                  </select>

                  <button
                    onClick={() =>
                      setSortOrder((order) =>
                        order === "desc" ? "asc" : "desc"
                      )
                    }
                    className="p-2 border rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700"
                    title={
                      sortOrder === "desc"
                        ? "Sort Descending"
                        : "Sort Ascending"
                    }
                  >
                    {sortOrder === "desc" ? "↓" : "↑"}
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode("card")}
                  className={`p-2 border rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 ${
                    viewMode === "card"
                      ? "bg-blue-500 text-white"
                      : "text-blue-500"
                  }`}
                  title="Card View"
                >
                  <BsCardText size={20} />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 border rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 ${
                    viewMode === "list"
                      ? "bg-blue-500 text-white"
                      : "text-blue-500"
                  }`}
                  title="List View"
                >
                  <BsList size={20} />
                </button>
              </div>

              {user?.publicMetadata?.isAdmin && (
                <button
                  onClick={() => {
                    setEditingVideo(null);
                    setVideoModal(true);
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
                >
                  Add New Video
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        renderSkeletons()
      ) : videos.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center">
          <p className="text-xl text-gray-500 mb-4">No videos found</p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-blue-500 hover:underline"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <>
          {viewMode === "card" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
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
            <div className="flex flex-col gap-4 mb-8">
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-auto">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border rounded-xl disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Previous
              </button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-4 py-2 border rounded-xl ${
                      currentPage === pageNum
                        ? "bg-blue-500 text-white"
                        : "hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="px-4 py-2 border rounded-xl disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Edit/Add Modal */}
      {videoModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className="bg-black/80 absolute inset-0"
            onClick={() => setVideoModal(false)}
          ></div>
          <div className="relative bg-white dark:bg-gray-800 h-5/6 p-5 overflow-auto sm:w-2/3 w-full lg:w-1/3 rounded-xl shadow-lg m-5">
            <button
              className="absolute right-5 top-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              onClick={() => setVideoModal(false)}
            >
              <svg
                stroke="currentColor"
                fill="none"
                strokeWidth="2"
                viewBox="0 0 24 24"
                className="h-5 w-5"
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
                onUpdate={handleUpdateVideo}
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
