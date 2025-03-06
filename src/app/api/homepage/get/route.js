import Homepage from "@/lib/models/Homepage";
import { connect } from "../../../../lib/mongodb/mongoose.js";

// Handler for GET requests
export async function GET(request) {
  await connect();
  try {
    let content = await Homepage.findOne();
    if (!content) {
      content = new Homepage();
    }
    await content.save();
    return new Response(JSON.stringify(content), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching homepage content:", error);
    return new Response(
      JSON.stringify({
        error: "Error fetching homepage content",
        details: error,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// Handler for PUT requests
export async function PUT(request) {
  await connect();
  try {
    const data = await request.json();
    const { greeting, description } = data;
    let content = await Homepage.findOne();

    if (!content) {
      content = new Homepage({ greeting, description });
    } else {
      content.greeting = greeting;
      content.description = description;
    }

    await content.save();
    return new Response(JSON.stringify(content), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error updating homepage content:", error);
    return new Response(
      JSON.stringify({
        error: "Error updating homepage content",
        details: error,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
