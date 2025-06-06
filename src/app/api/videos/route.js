// src/app/api/videos/route.js
import Videos from "@/lib/models/Videos";
import { connect } from "@/lib/mongodb/mongoose";
import { getAuth } from "@clerk/nextjs/server";

// Utility: Validate video URL
const validateVideoUrl = (url, platform) => {
  if (platform === "YouTube") {
    return url.includes("youtube.com") || url.includes("youtu.be");
  } else if (platform === "Facebook") {
    return url.includes("facebook.com") || url.includes("fb.watch");
  }
  return false;
};

// GET: Fetch videos with pagination, filtering, and sorting
export async function GET(request) {
  try {
    await connect();
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get("videoId");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const sort = searchParams.get("sort") || "recordingDate";
    const order = searchParams.get("order") || "desc";
    const status = searchParams.get("status") || "active";

    // If a videoId is provided, fetch that single video
    if (videoId) {
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
    }

    // Build query
    const query = { status };
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    const sortOptions = { [sort]: order === "desc" ? -1 : 1 };

    // Execute query with pagination and sorting
    const [videos, total] = await Promise.all([
      Videos.find(query).sort(sortOptions).skip(skip).limit(limit),
      Videos.countDocuments(query),
    ]);

    return new Response(
      JSON.stringify({
        videos,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        },
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error in videos API:", error);
    return new Response(
      JSON.stringify({
        error: "Error fetching videos",
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// POST: Create a new video
export async function POST(request) {
  try {
    await connect();
    const auth = getAuth(request);

    if (!auth?.userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const data = await request.json();
    const { title, videoUrl, description, platform, category, recordingDate } =
      data;

    // Validate required fields
    if (!title || !videoUrl || !platform || !category || !recordingDate) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields",
          required: [
            "title",
            "videoUrl",
            "platform",
            "category",
            "recordingDate",
          ],
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate video URL
    if (!validateVideoUrl(videoUrl, platform)) {
      return new Response(
        JSON.stringify({
          error: "Invalid video URL for the selected platform",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Create new video
    const newVideo = await Videos.create({
      title,
      description,
      videoUrl,
      platform,
      category,
      recordingDate,
    });

    return new Response(JSON.stringify(newVideo), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating video:", error);
    return new Response(
      JSON.stringify({
        error: "Error creating video",
        details: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
