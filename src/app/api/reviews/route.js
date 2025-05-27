import Review from "@/lib/models/Review";
import { connect } from "@/lib/mongodb/mongoose";

export async function GET(req) {
  await connect();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);
  const search = searchParams.get("search") || "";
  const skip = (page - 1) * limit;

  if (id) {
    try {
      const review = await Review.findById(id);
      if (!review) {
        return new Response(JSON.stringify({ error: "review not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ review }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error fetching review:", error);
      return new Response(JSON.stringify({ error: "Error fetching review" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // Build search query
  const searchQuery = search
    ? {
        $or: [
          { userName: { $regex: search, $options: "i" } },
          { reviewText: { $regex: search, $options: "i" } },
          { profession: { $regex: search, $options: "i" } },
        ],
      }
    : {};

  // Get total count for pagination
  const total = await Review.countDocuments(searchQuery);

  // Fetch reviews with pagination and search
  const reviews = await Review.find(searchQuery)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return new Response(
    JSON.stringify({
      reviews,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }),
    {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=10, stale-while-revalidate=59",
      },
    }
  );
}

export async function POST(req) {
  await connect();
  const { userId, reviewText, profession, userName, userProfilePic } =
    await req.json();

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const newReview = new Review({
    userId,
    userName,
    profession,
    userProfilePic,
    reviewText,
  });

  await newReview.save();

  return Response.json({
    message: "Review submitted successfully.",
    review: newReview,
  });
}

export async function PUT(req) {
  await connect();
  const {
    userId,
    reviewId,
    reviewText,
    profession,
    userName,
    status,
    userProfilePic,
  } = await req.json();

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const review = await Review.findById(reviewId);

  if (!review) {
    return new Response("Review not found", { status: 404 });
  }
  review.userName = userName;
  review.reviewText = reviewText;
  review.userProfilePic = userProfilePic;
  review.profession = profession;
  review.status = status;
  const newReview = await review.save();
  return Response.json({ message: "Review updated.", review: newReview });
}

export async function PATCH(req) {
  const { reviewId, userId } = await req.json();
  const review = await Review.findById(reviewId);
  if (!userId) {
    return new Response(JSON.stringify({ error: "Missing userId" }), {
      status: 400,
    });
  }

  if (!review) {
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
    });
  }

  const liked = review.likes.includes(userId);
  if (liked) {
    review.likes.pull(userId); // Unlike
  } else {
    review.likes.push(userId); // Like
  }

  await review.save();
  return Response.json({ message: liked ? "Unliked" : "Liked" });
}

export async function DELETE(req) {
  await connect();
  const { reviewId } = await req.json();

  const review = await Review.findByIdAndDelete(reviewId);
  if (!review) {
    return new Response(JSON.stringify({ error: "Review not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  await Review.findByIdAndDelete(reviewId);

  return new Response(null, { status: 204 });
}
