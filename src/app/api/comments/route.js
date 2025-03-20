import Comment from "@/lib/models/Comment";
import { connect } from "@/lib/mongodb/mongoose";

export async function GET(request) {
  await connect();
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get("videoId");

  if (!videoId) {
    return new Response(JSON.stringify({ error: "Missing videoId" }), {
      status: 400,
    });
  }

  try {
    const comments = await Comment.find({ videoId, parentComment: null })
      .populate({
        path: "replies",
        options: { sort: { createdAt: -1 } },
      })
      .sort({ createdAt: -1 });

    return new Response(JSON.stringify({ comments }), { status: 200 });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Error fetching comments", error }),
      {
        status: 500,
      }
    );
  }
}

export async function POST(request) {
  await connect();
  const data = await request.json();

  if (!data.videoId || !data.userId || !data.username || !data.content) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), {
      status: 400,
    });
  }

  const newComment = await Comment.create({
    ...data,
    parentComment: data.parentComment || null,
  });

  if (data.parentComment) {
    await Comment.findByIdAndUpdate(data.parentComment, {
      $push: { replies: newComment._id },
    });
  }

  return new Response(JSON.stringify(newComment), { status: 201 });
}

export async function PUT(request) {
  await connect();
  try {
    const { commentId, userId } = await request.json();

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return new Response(JSON.stringify({ error: "Comment not found" }), {
        status: 404,
      });
    }

    if (comment.likes.includes(userId)) {
      comment.likes = comment.likes.filter((id) => id !== userId);
    } else {
      comment.likes.push(userId);
    }

    await comment.save();
    return new Response(JSON.stringify({ likes: comment.likes.length }), {
      status: 200,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Error liking comment", error }),
      {
        status: 500,
      }
    );
  }
}
