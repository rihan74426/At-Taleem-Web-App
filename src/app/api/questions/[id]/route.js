import Question from "@/lib/models/Question";
import { connect } from "@/lib/mongodb/mongoose";
// import sendEmail from "@/lib/utils/sendEmail"; // Ensure your sendEmail utility is correctly exported

export async function PATCH(request, { params }) {
  await connect();
  try {
    const { id } = await params; // id from URL params
    const { userId, answer, category } = await request.json();

    if (!userId) {
      return new Response(JSON.stringify({ error: "Missing userId" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fetch the current question
    const question = await Question.findById(id);
    if (!question) {
      return new Response(JSON.stringify({ error: "Question not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const index = question.helpfulVotes.indexOf(userId);
    if (answer && category) {
      question.answer = answer;
      question.category = category;
      question.status = "answered";
      question.answeredAt = new Date();
      question.helpfulVotes = [];
    } else if (index === -1) {
      // Not voted yet, add the user's vote
      question.helpfulVotes.push(userId);
    } else {
      // User already voted, so remove their vote
      question.helpfulVotes.splice(index, 1);
    }

    const updatedQuestion = await question.save();
    return new Response(JSON.stringify(updatedQuestion), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error toggling helpful vote:", error);
    return new Response(
      JSON.stringify({ error: "Error toggling helpful vote" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

export async function DELETE(request, { params }) {
  await connect();
  try {
    const { id } = await params;
    const deletedQuestion = await Question.findByIdAndDelete(id);
    if (!deletedQuestion) {
      return new Response(JSON.stringify({ error: "Question not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error deleting question:", error);
    return new Response(JSON.stringify({ error: "Error deleting question" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
