import Question from "@/lib/models/Question";
import { connect } from "@/lib/mongodb/mongoose";
// import sendEmail from "@/lib/utils/sendEmail"; // Ensure your sendEmail utility is correctly exported

export async function PATCH(request, { params }) {
  await connect();
  try {
    const { id } = await params; // params is an object with id property
    const data = await request.json();

    // Validate that answer is provided
    if (!data.answer) {
      return new Response(JSON.stringify({ error: "Missing answer" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    } else {
      const updatedQuestion = await Question.findByIdAndUpdate(
        id,
        {
          answer: data.answer,
          category: data.category,
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

      // Update the question with the answer, change status, and set answeredAt timestamp

      // Trigger email if question has an email and its helpfulCount is 10 or more
      // if (updatedQuestion.email) {
      //   await sendEmail({
      //     to: updatedQuestion.email,
      //     subject: "Your Question Has Been Answered",
      //     text: `Your question "${updatedQuestion.title}" has been answered: ${updatedQuestion.answer}`,
      //   });
      // }
      // if (updatedQuestion.helpfulCount >= 10) {
      //   await sendEmail({
      //     to: updatedQuestion.email,
      //     subject: "Your Question Helped more than 10 people",
      //   });
      // }

      return new Response(JSON.stringify(updatedQuestion), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
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
