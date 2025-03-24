import Question from "@/lib/models/Question";
import { connect } from "@/lib/mongodb/mongoose";
// Import your email utility (e.g., using nodemailer) if needed
// import { sendEmail } from "@/lib/email";

export async function POST(request) {
  await connect();
  try {
    const data = await request.json();
    const { title, description, category, userId, username, email } = data;

    // Validate required fields
    if (!title || !category || (!userId && !email)) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const newQuestion = await Question.create({
      title,
      description,
      category, // expects an array of strings
      userId: userId || null,
      username: username || "Anonymous",
      email: email || null,
    });

    // Optionally, send a notification email that a new question was posted
    // (if needed, for admin notifications)
    // await sendEmail({ subject: "New Question Posted", to: adminEmail, text: ... });
    if (email) {
      await sendEmail(
        email,
        "Question Received",
        "We have received your question and will answer it soon."
      );
    }
    return new Response(JSON.stringify(newQuestion), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error adding question:", error);
    return new Response(JSON.stringify({ error: "Error adding question" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function GET(request) {
  await connect();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status"); // e.g., "pending" or "answered"
  const category = searchParams.get("category"); // can be comma-separated list
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = 10;
  const skip = (page - 1) * limit;

  let query = {};
  if (status) query.status = status;
  if (category) {
    // If multiple categories are provided, split and search for any match
    const cats = category.split(",");
    query.category = { $in: cats };
  }

  try {
    const questions = await Question.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Question.countDocuments(query);

    return new Response(
      JSON.stringify({
        questions,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error fetching questions:", error);
    return new Response(JSON.stringify({ error: "Error fetching questions" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function PUT(request) {
  await connect();
  try {
    const { questionId } = await request.json();
    if (!questionId) {
      return new Response(JSON.stringify({ error: "Missing questionId" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Increment the helpful count by 1
    const updatedQuestion = await Question.findByIdAndUpdate(
      questionId,
      { $inc: { helpful: 1 } },
      { new: true }
    );

    if (!updatedQuestion) {
      return new Response(JSON.stringify({ error: "Question not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ helpful: updatedQuestion.helpful }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error updating helpful count:", error);
    return new Response(
      JSON.stringify({ error: "Error updating helpful count" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
