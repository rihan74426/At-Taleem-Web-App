"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ReactPlayer from "react-player";
import VideoComments from "@/app/Components/VideoComments";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import AdminVideosPage from "@/app/dashboard/videos/page";

export default function VideoDetailPage() {
  const params = useParams();
  const videoId = params.videoId; // The ID of the video from the URL
  const router = useRouter();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [videoModal, setVideoModal] = useState(false);
  const [editingVideo, setEditingVideo] = useState(null);

  // Function to fetch video details
  const fetchVideo = async () => {
    try {
      const res = await fetch(`/api/videos?videoId=${videoId}`);
      if (!res.ok) throw new Error("Failed to fetch video");
      const data = await res.json();
      if (!data.video) throw new Error("Video not found");
      setVideo(data.video);
    } catch (err) {
      console.error("Error fetching video:", err);
      setError(err.message || "Error fetching video");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideo();
  }, [videoId]);

  // Delete video handler
  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this video?")) return;
    const res = await fetch(`/api/videos/${video._id}`, { method: "DELETE" });
    if (res.ok) {
      // After deletion, navigate to the parent listing page
      router.push(`/${video.category.toLowerCase()}-videos`);
    } else {
      alert("Failed to delete video.");
    }
  };

  // Edit video handler: sets editing video and opens modal
  const handleEdit = (video) => {
    setEditingVideo(video);
    setVideoModal(true);
  };

  // onUpdate callback passed to AdminVideosPage: update state with edited video
  const handleUpdateVideo = (updatedVideo) => {
    setVideo(...updatedVideo, (_id = video._id));
    setVideoModal(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-xl">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-xl text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 min-h-screen">
      <div className="flex justify-between">
        <h1 className="text-3xl font-bold mb-4">{video.title}</h1>

        <div className="flex gap-2 ">
          <button
            onClick={() => handleEdit(video)}
            title="Edit Video"
            className="p-2 text-blue-500 hover:text-blue-700"
          >
            <FiEdit2 size={20} />
          </button>
          <button
            onClick={handleDelete}
            title="Delete Video"
            className="p-2 text-red-500 hover:text-red-700"
          >
            <FiTrash2 size={20} />
          </button>
        </div>
      </div>

      {/* Video Player */}
      <div className="relative  flex place-content-center w-full pb-[56.25%] mb-6">
        {" "}
        {video.platform === "YouTube" ? (
          <ReactPlayer
            url={video.videoUrl}
            width="100%"
            height="100%"
            className="absolute top-0 left-0"
            controls
          />
        ) : (
          <div
            className="absolute items-center place-content-center flex w-full h-full"
            dangerouslySetInnerHTML={{ __html: video.videoUrl }}
          />
        )}
      </div>

      {/* Video Description */}
      <div>
        <h2 className="text-2xl font-bold">Video Description:</h2>
        <p className="text-lg whitespace-pre-wrap">
          {video.description || "No description added!"}
        </p>
      </div>

      {/* Video Recording Date */}
      {video.recordingDate && (
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold">Recording Date:</h2>
          <p className="text-lg">
            {new Date(video.recordingDate).toLocaleDateString()}
          </p>
        </div>
      )}

      {/* Comments Section */}
      <VideoComments videoId={video._id} />

      {/* Modal for Editing Video */}
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
                onClose={() => setVideoModal(false)}
                onUpdate={handleUpdateVideo}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
