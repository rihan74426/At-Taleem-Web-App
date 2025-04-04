import Comment from "@/lib/models/Comment";
import { connect } from "@/lib/mongodb/mongoose";

export async function PATCH(request, { params }) {
  await connect();
  try {
    const { id } = await params;
    const { content } = await request.json();

    if (!content) {
      return new Response(JSON.stringify({ error: "Missing content" }), {
        status: 400,
      });
    }

    const updatedComment = await Comment.findByIdAndUpdate(
      id,
      { content },
      { new: true }
    );

    if (!updatedComment) {
      return new Response(JSON.stringify({ error: "Comment not found" }), {
        status: 404,
      });
    }

    return new Response(JSON.stringify(updatedComment), { status: 200 });
  } catch (error) {
    console.error("Error editing comment:", error);
    return new Response(JSON.stringify({ error: "Error editing comment" }), {
      status: 500,
    });
  }
}

// DELETE: Delete a comment or reply
export async function DELETE(request, { params }) {
  await connect();
  try {
    const { id } = await params;

    const deletedComment = await Comment.findByIdAndDelete(id);
    if (!deletedComment) {
      return new Response(JSON.stringify({ error: "Comment not found" }), {
        status: 404,
      });
    }

    // Remove comment from parent's replies list
    if (deletedComment.parentComment) {
      await Comment.findByIdAndUpdate(deletedComment.parentComment, {
        $pull: { replies: deletedComment._id },
      });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return new Response(JSON.stringify({ error: "Error deleting comment" }), {
      status: 500,
    });
  }
}
