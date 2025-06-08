import Question from "@/lib/models/Question";
import { connect } from "@/lib/mongodb/mongoose";

export async function POST(request, { params }) {
  await connect();
  try {
    const { id } = params;
    const { userId } = await request.json();

    if (!userId) {
      return new Response(JSON.stringify({ error: "Missing userId" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const question = await Question.findById(id);
    if (!question) {
      return new Response(JSON.stringify({ error: "Question not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Toggle bookmark
    const bookmarkIndex = question.bookmarks.indexOf(userId);
    if (bookmarkIndex === -1) {
      question.bookmarks.push(userId);
    } else {
      question.bookmarks.splice(bookmarkIndex, 1);
    }

    await question.save();

    return new Response(JSON.stringify(question), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error toggling bookmark:", error);
    return new Response(JSON.stringify({ error: "Error toggling bookmark" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
