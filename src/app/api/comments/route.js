import Comment from "@/lib/models/Comment";
import { connect } from "@/lib/mongodb/mongoose";

export async function GET(request) {
  await connect();
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get("videoId");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  if (!videoId) {
    return new Response(JSON.stringify({ error: "Missing videoId" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const query = { videoId };
  try {
    const comments = await Comment.find(query)
      .sort({ createdAt: -1 }) // latest first
      .skip((page - 1) * limit)
      .limit(limit);
    const total = await Comment.countDocuments(query);

    return new Response(JSON.stringify({ comments, total, page, limit }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return new Response(JSON.stringify({ error: "Error fetching comments" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function POST(request) {
  await connect();
  try {
    const data = await request.json();
    // Expect data to have videoId, userId, username, content.
    if (!data.videoId || !data.userId || !data.username || !data.content) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    const newComment = await Comment.create({
      videoId: data.videoId,
      userId: data.userId,
      username: data.username,
      content: data.content,
    });
    return new Response(JSON.stringify(newComment), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error adding comment:", error);
    return new Response(JSON.stringify({ error: "Error adding comment" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
