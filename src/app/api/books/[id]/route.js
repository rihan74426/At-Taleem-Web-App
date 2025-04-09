import Book from "@/lib/models/Book";
import { connect } from "@/lib/mongodb/mongoose";

export async function PATCH(request, { params }) {
  await connect();
  try {
    const { id } = await params;
    const data = await request.json();
    if (
      !data.title ||
      !data.author ||
      !data.coverImage ||
      !data.price ||
      !data.fullPdfUrl
    ) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    const updatedBook = await Book.findByIdAndUpdate(id, data, { new: true });
    if (!updatedBook) {
      return new Response(JSON.stringify({ error: "Book not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify(updatedBook), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
