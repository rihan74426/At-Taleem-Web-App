import Question from "@/lib/models/Question";
import { connect } from "@/lib/mongodb/mongoose";
// Import your email utility (e.g., using nodemailer) if needed
// import { sendEmail } from "@/lib/email";

export async function POST(request) {
  await connect();
  try {
    const data = await request.json();
    const {
      title,
      description,
      category,
      userId,
      username,
      email,
      isAnonymous,
    } = data;

    // Validate required fields
    if (!title || !email) {
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
      username: username,
      isAnonymous: isAnonymous,
      email: email || null,
      helpfulVotes: [],
      bookmarks: [],
      status: "pending",
    });

    // Optionally, send a notification email that a new question was posted
    // (if needed, for admin notifications)
    // await sendEmail({ subject: "New Question Posted", to: adminEmail, text: ... });
    // if (email) {
    //   await sendEmail(
    //     email,
    //     "Question Received",
    //     "We have received your question and will answer it soon."
    //   );
    // }
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
  const id = searchParams.get("id");

  // If an id is provided, fetch that single question
  if (id) {
    try {
      const question = await Question.findById(id).populate("category");
      if (!question) {
        return new Response(JSON.stringify({ error: "Question not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ question }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error fetching question:", error);
      return new Response(
        JSON.stringify({ error: "Error fetching question" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }

  // For multiple questions, build a query
  const status = searchParams.get("status");
  const category = searchParams.get("category");
  const search = searchParams.get("search");
  const sort = searchParams.get("sort") || "newest";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);
  const skip = (page - 1) * limit;

  let query = {};

  if (status && status !== "all") query.status = status;
  if (category && category !== "all") {
    const cats = category.split(",");
    query.category = { $in: cats };
  }
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  // Build sort object based on sort parameter
  let sortObj = {};
  switch (sort) {
    case "oldest":
      sortObj = { createdAt: 1 };
      break;
    case "most_helpful":
      sortObj = { "helpfulVotes.length": -1, createdAt: -1 };
      break;
    case "most_bookmarked":
      sortObj = { "bookmarks.length": -1, createdAt: -1 };
      break;
    default: // newest
      sortObj = { createdAt: -1 };
  }

  try {
    const questions = await Question.find(query)
      .sort(sortObj)
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
    const data = await request.json();
    const { questionId, title, description, category, isAnonymous, email } =
      data;

    if (!questionId) {
      return new Response(JSON.stringify({ error: "Missing questionId" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const updateFields = {};
    if (title !== undefined) updateFields.title = title;
    if (description !== undefined) updateFields.description = description;
    if (category !== undefined) updateFields.category = category;
    if (isAnonymous !== undefined) updateFields.isAnonymous = isAnonymous;
    if (email !== undefined) updateFields.email = email;

    const updatedQuestion = await Question.findByIdAndUpdate(
      questionId,
      updateFields,
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
    console.error("Error editing question:", error);
    return new Response(JSON.stringify({ error: "Error editing question" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
