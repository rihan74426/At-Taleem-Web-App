import Comment from "@/lib/models/Comment";
import { connect } from "@/lib/mongodb/mongoose";

export async function GET(request) {
  await connect();
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get("videoId");
  const expanded = searchParams.get("expanded") === "true"; // If true, fetch all comments

  if (!videoId) {
    return new Response(JSON.stringify({ error: "Missing videoId" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    let comments;

    if (expanded) {
      comments = await Comment.find({ videoId, parentId: null })
        .sort({ createdAt: -1 })
        .populate("replies");
    } else {
      comments = await Comment.find({ videoId, parentId: null })
        .sort({ createdAt: -1 })
        .limit(1); // Fetch only the first comment initially
    }

    const total = await Comment.countDocuments({ videoId, parentId: null });

    return new Response(JSON.stringify({ comments, total }), {
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

// Add a new comment or reply
export async function POST(request) {
  await connect();
  try {
    const data = await request.json();
    if (!data.videoId || !data.userId || !data.username || !data.content) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Create the new comment (or reply)
    const newComment = await Comment.create({
      videoId: data.videoId,
      userId: data.userId,
      username: data.username,
      content: data.content,
      parentId: data.parentId || null,
    });

    // If this is a reply, update the parent's replies array
    if (data.parentId) {
      await Comment.findByIdAndUpdate(data.parentId, {
        $push: { replies: newComment._id },
      });
    }

    return new Response(JSON.stringify(newComment), {
      status: 201,
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

// Like a comment
export async function PUT(request) {
  await connect();
  try {
    const { commentId, userId } = await request.json();

    if (!commentId || !userId) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return new Response(JSON.stringify({ error: "Comment not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Toggle like
    if (comment.likes?.includes(userId)) {
      comment.likes = comment.likes.filter((id) => id !== userId);
    } else {
      comment.likes.push(userId);
    }

    await comment.save();

    return new Response(JSON.stringify({ likes: comment.likes.length }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error liking comment:", error);
    return new Response(JSON.stringify({ error: "Error liking comment" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
