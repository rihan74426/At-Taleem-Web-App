import Category from "@/lib/models/Category";
import { connect } from "@/lib/mongodb/mongoose";

export async function GET() {
  await connect();

  try {
    const categories = await Category.find();

    return new Response(JSON.stringify({ categories }), { status: 200 });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Error fetching categories", error }),
      {
        status: 500,
      }
    );
  }
}

export async function POST(request) {
  await connect();
  const data = await request.json();

  if (!data.name) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const newCategory = await Category.create(data);
    return new Response(JSON.stringify(newCategory), {
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
