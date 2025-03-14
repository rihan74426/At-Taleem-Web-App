// src/app/api/videos/route.js
import Videos from "@/lib/models/Videos";
import { connect } from "@/lib/mongodb/mongoose";

// Utility: Normalize video URL
function normalizeVideoUrl(platform, url) {
  if (platform === "YouTube") {
    // Convert share URL to embed URL if necessary.
    // e.g., from "https://youtu.be/VIDEO_ID" to "https://www.youtube.com/embed/VIDEO_ID"
    const ytMatch =
      url.match(/youtu\.be\/([A-Za-z0-9_-]+)/) ||
      url.match(/v=([A-Za-z0-9_-]+)/);
    if (ytMatch) {
      return `https://www.youtube.com/embed/${ytMatch[1]}`;
    }
    return url;
  } else if (platform === "Facebook") {
    // Facebook embed: Use Facebook's standard embed URL pattern.
    // For example, if the URL is "https://www.facebook.com/{page}/videos/{id}/", you may have to format it.
    // For simplicity, we'll assume the URL is already an embed URL.
    return url;
  }
  return url;
}

// GET: Paginated videos, sorted descending

export async function GET(request) {
  await connect();
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get("videoId");

  // If a videoId is provided, fetch that single video.
  if (videoId) {
    try {
      const video = await Videos.findById(videoId);
      if (!video) {
        return new Response(JSON.stringify({ error: "Video not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ video }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error fetching video:", error);
      return new Response(JSON.stringify({ error: "Error fetching video" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // Otherwise, handle pagination for the video list
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = 20;
  const skip = (page - 1) * limit;

  try {
    const videos = await Videos.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalVideos = await Videos.countDocuments();

    const responseBody = {
      videos,
      totalPages: Math.ceil(totalVideos / limit),
      currentPage: page,
    };

    return new Response(JSON.stringify(responseBody), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching videos:", error);
    return new Response(JSON.stringify({ error: "Error fetching videos" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function POST(request) {
  await connect();
  try {
    const data = await request.json();
    const { title, videoUrl, embedCode, platform, category } = data;

    // Validate required fields
    if (!title || !videoUrl || !platform || !category) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // For YouTube, generate embed code automatically
    let finalEmbedCode = embedCode;
    if (platform === "YouTube") {
      // Example: generate YouTube embed URL
      finalEmbedCode = `<iframe
          src=${videoUrl}
          title=${title}
          className="absolute top-0 left-0 w-full h-full"
          scrolling="no"
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
          allowFullScreen
        ></iframe>`;
    }

    const newVideo = await Videos.create({
      title,
      videoUrl,
      embedCode: finalEmbedCode,
      platform,
      category,
    });

    return new Response(JSON.stringify(newVideo), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error adding video:", error);
    return new Response(
      JSON.stringify({ error: "Error adding video", details: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
