import Videos from "@/lib/models/Videos";
import { connect } from "@/lib/mongodb/mongoose";

// PATCH: Update a video
export async function PATCH(request, { params }) {
  await connect();
  try {
    const { id } = await params;
    const data = await request.json();
    const updatedVideo = await Videos.findByIdAndUpdate(id, data, {
      new: true,
    });
    if (!updatedVideo) {
      return new Response(JSON.stringify({ error: "Video not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify(updatedVideo), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error updating video:", error);
    return new Response(JSON.stringify({ error: "Error updating video" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// DELETE: Remove a video
export async function DELETE(request, { params }) {
  await connect();
  try {
    const { id } = await params;
    const deletedVideo = await Videos.findByIdAndDelete(id);
    if (!deletedVideo) {
      return new Response(JSON.stringify({ error: "Video not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error deleting video:", error);
    return new Response(JSON.stringify({ error: "Error deleting video" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
