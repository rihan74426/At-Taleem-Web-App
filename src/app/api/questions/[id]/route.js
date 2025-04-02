import Question from "@/lib/models/Question";
import { connect } from "@/lib/mongodb/mongoose";
// import sendEmail from "@/lib/utils/sendEmail"; // Ensure your sendEmail utility is correctly exported

export async function PATCH(request, { params }) {
  await connect();
  try {
    // Extract the question ID from params
    const { id } = await params;
    const data = await request.json();

    // Validate that the increment value is provided
    if (!data.increment) {
      return new Response(
        JSON.stringify({ error: "Missing increment value" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Update the helpfulCount by incrementing it
    const updatedQuestion = await Question.findByIdAndUpdate(
      id,
      { $inc: { helpfulCount: data.increment } },
      { new: true }
    );

    if (!updatedQuestion) {
      return new Response(JSON.stringify({ error: "Question not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(updatedQuestion), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error updating helpful count:", error);
    return new Response(
      JSON.stringify({ error: "Error updating helpful count" }),
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
