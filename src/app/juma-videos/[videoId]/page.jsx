"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ReactPlayer from "react-player";
import VideoComments from "@/app/Components/VideoComments";

export default function VideoDetailPage() {
  const params = useParams();
  const videoId = params.videoId; // The ID of the video from the URL
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchVideo() {
      try {
        const res = await fetch(`/api/videos?videoId=${videoId}`);
        if (!res.ok) {
          throw new Error("Failed to fetch video");
        }
        const data = await res.json();
        if (!data.video) {
          throw new Error("Video not found");
        }
        setVideo(data.video);
      } catch (err) {
        console.error("Error fetching video:", err);
        setError(err.message || "Error fetching video");
      } finally {
        setLoading(false);
      }
    }
    fetchVideo();
  }, [videoId]);

  // Full-screen loader
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen ">
        <p className="text-xl">Loading...</p>
      </div>
    );
  }

  // Error state
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
        <p className=" italic">Category: {video.category}</p>
      </div>
      {/* Responsive container with 16:9 aspect ratio */}
      <div className="relative w-full pb-[56.25%] mb-6">
        {video?.platform === "YouTube" ? (
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
            dangerouslySetInnerHTML={{
              __html: video.videoUrl,
            }}
          />
        )}
      </div>
      <div>
        <h2 className="text-2xl font-bold">Video Description:</h2>
        <p className="text-lg whitespace-pre-wrap">
          {video.description ? video.description : "No description added!"}
        </p>
      </div>
      <VideoComments videoId={video._id} />
    </div>
  );
}
