import Comment from "@/lib/models/Comment";
import { connect } from "@/lib/mongodb/mongoose";

export async function GET(request) {
  await connect();
  const { searchParams } = new URL(request.url);
  const entityId = searchParams.get("entityId");
  const commentType = searchParams.get("commentType"); // "video" or "question"

  if (!entityId || !commentType) {
    return new Response(
      JSON.stringify({ error: "Missing entityId or commentType" }),
      {
        status: 400,
      }
    );
  }

  try {
    const comments = await Comment.find({
      entityId,
      commentType,
      parentComment: null,
    })
      .populate({
        path: "replies",
        options: { sort: { createdAt: +1 } },
      })
      .sort({ createdAt: +1 });

    return new Response(JSON.stringify({ comments }), { status: 200 });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Error fetching comments", details: error }),
      { status: 500 }
    );
  }
}

export async function POST(request) {
  await connect();
  const data = await request.json();

  if (
    !data.entityId ||
    !data.commentType ||
    !data.userId ||
    !data.username ||
    !data.content
  ) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), {
      status: 400,
    });
  }

  const newComment = await Comment.create({
    entityId: data.entityId, // Can be a videoId or questionId
    commentType: data.commentType, // "video" or "question"
    userId: data.userId,
    username: data.username,
    content: data.content,
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
      JSON.stringify({ error: "Error liking comment", details: error }),
      { status: 500 }
    );
  }
}
