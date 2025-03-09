"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ReactPlayer from "react-player";
import VideoComments from "@/app/Components/VideoComments";

export default function VideoDetailPage() {
  const params = useParams();
  const videoId = params.videoId; // The ID of the video
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch video details (assuming you have an API route for video details)
    async function fetchVideo() {
      const res = await fetch(`/api/videos?videoId=${videoId}`);
      if (res.ok) {
        const data = await res.json();
        // Assuming data.videos is returned as an array, and we're taking the first one.
        setVideo(data.videos[0]);
      }
      setLoading(false);
    }
    fetchVideo();
  }, [videoId]);

  if (loading) return <p>Loading...</p>;
  if (!video) return <p>Video not found</p>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">{video.title}</h1>
      <div className="relative pb-[56.25%] mb-6">
        <ReactPlayer
          url={video.embedUrl}
          width="100%"
          height="100%"
          className="absolute top-0 left-0"
          controls
        />
      </div>
      <VideoComments videoId={video._id} />
    </div>
  );
}
