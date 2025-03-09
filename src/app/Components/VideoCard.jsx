import React from "react";

export default function VideoCard({ video }) {
  const embedUrl = video.videoUrl.includes("youtube")
    ? `https://www.youtube.com/embed/${video.videoUrl.split("v=")[1]}`
    : `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(
        video.videoUrl
      )}`;

  return (
    <div className="border rounded-lg p-4 shadow-md">
      <h3 className="font-bold">{video.title}</h3>
      {/* <iframe
        src={embedUrl}
        width="560"
        height="315"
        style="border:none;overflow:hidden"
        scrolling="no"
        frameborder="0"
        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
        allowFullScreen="true"
      ></iframe> */}
    </div>
  );
}
