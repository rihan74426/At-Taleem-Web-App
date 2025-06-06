import Videos from "@/lib/models/Videos";
import { connect } from "@/lib/mongodb/mongoose";
import { getAuth } from "@clerk/nextjs/server";

export async function POST(request, { params }) {
  try {
    await connect();
    const auth = getAuth(request);

    if (!auth?.userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { id } = await params;
    const video = await Videos.findById(id);

    if (!video) {
      return new Response(JSON.stringify({ error: "Video not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Initialize likes array if it doesn't exist
    if (!video.likes) {
      video.likes = [];
    }

    // Toggle like
    const isLiked = video.likes.includes(auth.userId);
    if (isLiked) {
      video.likes = video.likes.filter((id) => id !== auth.userId);
    } else {
      video.likes.push(auth.userId);
    }

    await video.save();

    return new Response(
      JSON.stringify({
        isLiked: !isLiked,
        likes: video.likes,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in video like API:", error);
    return new Response(JSON.stringify({ error: "Error processing like" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
