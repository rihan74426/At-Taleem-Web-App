"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ReactPlayer from "react-player";
import VideoComments from "./VideoComments";
import {
  FiEdit2,
  FiTrash2,
  FiHeart,
  FiShare2,
  FiEye,
  FiCalendar,
} from "react-icons/fi";
import AdminVideosPage from "../dashboard/videos/page";
import { useUser } from "@clerk/nextjs";
import ResponseModal from "./ResponseModal";
import { toast } from "react-hot-toast";
import { FacebookEmbed } from "react-social-media-embed";

export default function VideoDetail() {
  const params = useParams();
  const videoId = params.videoId;
  const router = useRouter();
  const { user, isLoaded: isUserLoaded } = useUser();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [videoModal, setVideoModal] = useState(false);
  const [editingVideo, setEditingVideo] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const [modal, setModal] = useState({
    isOpen: false,
    message: "",
    status: "",
  });

  const showModal = (message, status) => {
    setModal({ isOpen: true, message, status });
  };

  const fetchVideo = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/videos?videoId=${videoId}`);
      if (!res.ok) throw new Error("Failed to fetch video");
      const data = await res.json();
      if (!data.video) throw new Error("Video not found");
      setVideo(data.video);

      if (user) {
        setIsLiked(data.video.likes?.includes?.(user.id));
      }
    } catch (err) {
      console.error("Error fetching video:", err);
      setError(err.message || "Error fetching video");
      toast.error("Failed to load video");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (videoId) {
      fetchVideo();
    }
  }, [videoId]);

  // Increment video views
  useEffect(() => {
    if (video && !loading) {
      fetch(`/api/videos/${video._id}/view`, { method: "POST" }).catch((err) =>
        console.error("Error incrementing view:", err)
      );
    }
  }, [video, loading]);

  const handleLike = async () => {
    if (!user) {
      showModal("Please sign in to like videos", "error");
      return;
    }

    try {
      const res = await fetch(`/api/videos/${video._id}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });

      if (!res.ok) throw new Error("Failed to like video");

      const data = await res.json();
      setIsLiked(data.isLiked);
      setVideo((prev) => ({
        ...prev,
        likes: data.likes,
      }));
      toast.success(data.isLiked ? "Video liked" : "Video unliked");
    } catch (err) {
      console.error("Error liking video:", err);
      toast.error("Failed to like video");
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: video.title,
          text: video.description,
          url: window.location.href,
        });
        toast.success("Video shared successfully");
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      setIsSharing(true);
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setIsSharing(false), 2000);
    }
  };

  const handleDelete = async () => {
    if (!user?.publicMetadata?.isAdmin) {
      showModal("You need to be an admin to delete videos", "error");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this video?")) return;

    try {
      const res = await fetch(`/api/videos/${video._id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete video");

      toast.success("Video deleted successfully");
      router.push(`/${video.category.toLowerCase()}-videos`);
    } catch (err) {
      console.error("Error deleting video:", err);
      toast.error("Failed to delete video");
    }
  };

  const handleEdit = (video) => {
    if (!user?.publicMetadata?.isAdmin) {
      showModal("You need to be an admin to edit videos", "error");
      return;
    }
    setEditingVideo(video);
    setVideoModal(true);
  };

  const handleUpdateVideo = (updatedVideo) => {
    setVideo((prev) => ({ ...prev, ...updatedVideo }));
    setVideoModal(false);
    toast.success("Video updated successfully");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse w-full max-w-4xl">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-6" />
          <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg mb-6" />
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-xl text-red-500 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 min-h-screen">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">{video.title}</h1>

          <div className="flex gap-4">
            <button
              onClick={handleLike}
              title={isLiked ? "Unlike" : "Like"}
              className={`p-2 ${
                isLiked ? "text-red-500" : "text-gray-500"
              } hover:text-red-700 transition-colors`}
            >
              <FiHeart size={20} fill={isLiked ? "currentColor" : "none"} />
            </button>

            <button
              onClick={handleShare}
              title="Share"
              className={`p-2 text-gray-500 hover:text-gray-700 transition-colors ${
                isSharing ? "text-green-500" : ""
              }`}
            >
              <FiShare2 size={20} />
            </button>

            {user?.publicMetadata?.isAdmin && (
              <>
                <button
                  onClick={() => handleEdit(video)}
                  title="Edit Video"
                  className="p-2 text-blue-500 hover:text-blue-700 transition-colors"
                >
                  <FiEdit2 size={20} />
                </button>
                <button
                  onClick={handleDelete}
                  title="Delete Video"
                  className="p-2 text-red-500 hover:text-red-700 transition-colors"
                >
                  <FiTrash2 size={20} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Video Player */}
        <div className="relative w-full aspect-video mb-6 rounded-lg overflow-hidden shadow-lg">
          {video.platform === "YouTube" ? (
            <ReactPlayer
              url={video.videoUrl}
              width="100%"
              height="100%"
              className="absolute inset-0"
              controls
              playing={isPlaying}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              config={{
                youtube: {
                  playerVars: {
                    modestbranding: 1,
                    rel: 0,
                  },
                },
              }}
            />
          ) : (
            <FacebookEmbed
              url={video.videoUrl}
              width="100%"
              height="100%"
              className="absolute inset-0"
            />
          )}
        </div>

        {/* Video Stats */}
        <div className="flex items-center gap-6 mb-6 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <FiEye className="text-gray-400" />
            <span>{video.views} views</span>
          </div>
          <div className="flex items-center gap-2">
            <FiHeart className="text-gray-400" />
            <span>{video.likes?.length || 0} likes</span>
          </div>
          <div className="flex items-center gap-2">
            <FiCalendar className="text-gray-400" />
            <span>{new Date(video.recordingDate).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Video Description */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Description</h2>
          <p className="text-lg whitespace-pre-wrap text-gray-700 dark:text-gray-300">
            {video.description || "No description available"}
          </p>
        </div>
      </div>

      {/* Comments Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <VideoComments videoId={video._id} />
      </div>

      {/* Edit Modal */}
      {videoModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className="bg-black/80 absolute inset-0"
            onClick={() => setVideoModal(false)}
          ></div>
          <div className="relative bg-white dark:bg-gray-800 h-5/6 p-5 overflow-auto sm:w-2/3 w-full lg:w-1/3 rounded-xl shadow-lg m-5">
            <button
              className="absolute right-5 top-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
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
                onClose={() => setVideoModal(false)}
                onUpdate={handleUpdateVideo}
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
