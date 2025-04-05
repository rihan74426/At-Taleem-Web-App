import Book from "@/lib/models/Book";
import { connect } from "@/lib/mongodb/mongoose";

export async function GET(request) {
  await connect();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id"); // Use "id" here

  // If an id is provided, fetch that single question.
  if (id) {
    try {
      const book = await Book.findById(id);
      if (!book) {
        return new Response(JSON.stringify({ error: "book not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ book }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error fetching book:", error);
      return new Response(JSON.stringify({ error: "Error fetching books" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }
  try {
    const books = await Book.find({}).sort({ createdAt: -1 });
    return new Response(JSON.stringify({ books }), {
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

export async function POST(request) {
  await connect();
  const data = await request.json();
  const {
    title,
    author,
    coverImage,
    price,
    description,
    fullPdfUrl,
    freePages,
    categories,
  } = data;

  if (!title || !author || !coverImage || !price || !fullPdfUrl) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const newBook = await Book.create({
      title,
      author,
      coverImage,
      price,
      description,
      fullPdfUrl,
      freePages,
      categories,
    });
    return new Response(JSON.stringify(newBook), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
