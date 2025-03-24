import Question from "@/lib/models/Question";
import { connect } from "@/lib/mongodb/mongoose";

export async function PATCH(request, { params }) {
  await connect();
  try {
    const { id } = params;
    const data = await request.json();
    // Expect data.answer to be provided for updating an answer
    if (!data.answer) {
      return new Response(JSON.stringify({ error: "Missing answer content" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const updatedQuestion = await Question.findByIdAndUpdate(
      id,
      {
        answer: data.answer,
        status: "answered",
        answeredAt: new Date(),
      },
      { new: true }
    );

    if (!updatedQuestion) {
      return new Response(JSON.stringify({ error: "Question not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // If the question is answered and has been marked helpful by 10+ users, trigger an email to the asker.
    if (
      updatedQuestion.email &&
      updatedQuestion.helpful >= 10 // assuming 'helpful' is updated elsewhere (see next endpoint)
    ) {
      await sendEmail({
        to: updatedQuestion.email,
        subject: "Your question has been answered",
        text: updatedQuestion.answer,
      });
      console.log();
    }

    return new Response(JSON.stringify(updatedQuestion), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error updating question:", error);
    return new Response(JSON.stringify({ error: "Error updating question" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function DELETE(request, { params }) {
  await connect();
  try {
    const { id } = params;
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
