import Category from "@/lib/models/Category";
import { connect } from "@/lib/mongodb/mongoose";

export async function DELETE(request, { params }) {
  await connect();
  try {
    const { id } = await params;

    const deletedCategory = Category.findByIdAndDelete(id);

    if (!deletedCategory) {
      return new Response(JSON.stringify({ error: "Category not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error deleting comment:", err);
    return new Response(JSON.stringify({ error: "Error deleting category" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
