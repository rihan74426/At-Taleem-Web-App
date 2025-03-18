// src/app/api/videos/route.js
import Videos from "@/lib/models/Videos";
import { connect } from "@/lib/mongodb/mongoose";

// Utility: Normalize video URL

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

  // Handle pagination for the video list, with optional category filtering.
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = 10;
  const skip = (page - 1) * limit;
  const category = searchParams.get("category");

  try {
    const query = {};
    if (category) {
      query.category = category;
    }

    const videos = await Videos.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalVideos = await Videos.countDocuments(query);

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

    let { title, videoUrl, description, platform, category, recordingDate } =
      data;

    // Validate required fields
    if (!title || !videoUrl || !platform || !category || !recordingDate) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // If it's a Facebook embed code, replace the width & height
    if (platform === "Facebook") {
      videoUrl = videoUrl
        .replace(/width="\d+"/g, 'width="720"')
        .replace(/height="\d+"/g, 'height="405"')
        .replace(/([?&]width=)\d+/g, "$1" + 720)
        .replace(/([?&]height=)\d+/g, "$1" + 405);
    }

    // Create a new video document
    const newVideo = await Videos.create({
      title,
      description, // Ensure description is passed
      videoUrl,
      platform,
      category,
      recordingDate,
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
