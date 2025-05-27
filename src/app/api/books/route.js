import Book from "@/lib/models/Book";
import { connect } from "@/lib/mongodb/mongoose";

export async function GET(request) {
  await connect();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "12", 10);
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const skip = (page - 1) * limit;

  // If an id is provided, fetch that single book
  if (id) {
    try {
      const book = await Book.findById(id).populate("categories");
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
    // Build search query
    const searchQuery = {
      $or: [
        { title: { $regex: search, $options: "i" } },
        { author: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ],
    };

    // Add category filter if provided
    if (category) {
      searchQuery.categories = category;
    }

    // Get total count for pagination
    const total = await Book.countDocuments(searchQuery);

    // Fetch books with pagination and search
    const books = await Book.find(searchQuery)
      .populate("categories")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return new Response(
      JSON.stringify({
        books,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, s-maxage=10, stale-while-revalidate=59",
        },
      }
    );
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
