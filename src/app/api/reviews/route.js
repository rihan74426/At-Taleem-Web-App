// app/api/reviews/create/route.js

import Review from "@/lib/models/Review";
import { connect } from "@/lib/mongodb/mongoose";
export async function GET(req) {
  await connect();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
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
  const reviews = await Review.find({}).sort({ createdAt: -1 });
  return new Response(JSON.stringify({ reviews }));
}

export async function POST(req) {
  await connect();
  const { userId, reviewText, userName, userProfilePic } = await req.json();

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const newReview = new Review({
    userId,
    userName,
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
  const { userId, reviewId, newText } = await req.json();

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const review = await Review.findById(reviewId);

  if (!review) {
    return new Response("Review not found", { status: 404 });
  }
  if (newText) {
    review.reviewText = newText;
    const newReview = await review.save();
    return Response.json({ message: "Review updated.", review: newReview });
  } else {
    const liked = review.likes.includes(userId);
    if (liked) {
      review.likes.pull(userId); // Unlike
    } else {
      review.likes.push(userId); // Like
    }

    await review.save();
    return Response.json({ message: liked ? "Unliked" : "Liked" });
  }
}

export async function DELETE(req) {
  await connect();
  const { userId, reviewId } = await req.json();

  const review = await Review.findById(reviewId);

  if (!review || review.userId !== userId) {
    return new Response("Unauthorized or not found", { status: 403 });
  }

  await Review.findByIdAndDelete(reviewId);

  return new Response(null, { status: 204 });
}
