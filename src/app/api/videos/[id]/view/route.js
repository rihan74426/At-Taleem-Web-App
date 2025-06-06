import Videos from "@/lib/models/Videos";
import { connect } from "@/lib/mongodb/mongoose";

export async function POST(request, { params }) {
  try {
    await connect();
    const { id } = await params;
    const video = await Videos.findById(id);

    if (!video) {
      return new Response(JSON.stringify({ error: "Video not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Increment view count
    video.views += 1;
    await video.save();

    return new Response(JSON.stringify({ views: video.views }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Error in video view API:", error);
    return new Response(JSON.stringify({ error: "Error processing view" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
