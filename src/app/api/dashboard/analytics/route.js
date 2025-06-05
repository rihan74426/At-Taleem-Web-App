import { connect } from "@/lib/mongodb/mongoose";
import Videos from "@/lib/models/Videos";
import Book from "@/lib/models/Book";
import Event from "@/lib/models/Event";
import Institution from "@/lib/models/Institution";
import Question from "@/lib/models/Question";
import Comment from "@/lib/models/Comment";
import Review from "@/lib/models/Review";
import { clerkClient } from "@clerk/nextjs/server";

export async function GET() {
  try {
    await connect();

    // Get current date and first day of last month
    const now = new Date();
    const firstDayOfLastMonth = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1
    );
    const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Fetch all data in parallel
    const [
      users,
      videos,
      books,
      events,
      institutions,
      questions,
      comments,
      reviews,
    ] = await Promise.all([
      // Get users from Clerk
      (
        await clerkClient.users.getUserList()
      ).data,

      // Get videos
      Videos.find().sort({ createdAt: -1 }),

      // Get books
      Book.find().sort({ createdAt: -1 }),

      // Get events
      Event.find().sort({ createdAt: -1 }),

      // Get institutions
      Institution.find().sort({ createdAt: -1 }),

      // Get questions
      Question.find().sort({ createdAt: -1 }),

      // Get comments
      Comment.find().sort({ createdAt: -1 }),

      // Get reviews
      Review.find().sort({ createdAt: -1 }),
    ]);

    // Calculate last month's data
    const lastMonthData = {
      users: users.filter((user) => {
        const createdAt = new Date(user.createdAt);
        return (
          createdAt >= firstDayOfLastMonth && createdAt <= lastDayOfLastMonth
        );
      }).length,

      videos: videos.filter((video) => {
        const createdAt = new Date(video.createdAt);
        return (
          createdAt >= firstDayOfLastMonth && createdAt <= lastDayOfLastMonth
        );
      }).length,

      books: books.filter((book) => {
        const createdAt = new Date(book.createdAt);
        return (
          createdAt >= firstDayOfLastMonth && createdAt <= lastDayOfLastMonth
        );
      }).length,

      events: events.filter((event) => {
        const createdAt = new Date(event.createdAt);
        return (
          createdAt >= firstDayOfLastMonth && createdAt <= lastDayOfLastMonth
        );
      }).length,

      institutions: institutions.filter((institution) => {
        const createdAt = new Date(institution.createdAt);
        return (
          createdAt >= firstDayOfLastMonth && createdAt <= lastDayOfLastMonth
        );
      }).length,

      questions: questions.filter((question) => {
        const createdAt = new Date(question.createdAt);
        return (
          createdAt >= firstDayOfLastMonth && createdAt <= lastDayOfLastMonth
        );
      }).length,

      comments: comments.filter((comment) => {
        const createdAt = new Date(comment.createdAt);
        return (
          createdAt >= firstDayOfLastMonth && createdAt <= lastDayOfLastMonth
        );
      }).length,

      reviews: reviews.filter((review) => {
        const createdAt = new Date(review.createdAt);
        return (
          createdAt >= firstDayOfLastMonth && createdAt <= lastDayOfLastMonth
        );
      }).length,
    };

    // Return the analytics data
    return Response.json({
      users: {
        data: users.slice(0, 5),
        totalCount: users.length,
        lastMonthUsers: lastMonthData.users,
      },
      videos: {
        data: videos.slice(0, 5),
        totalCount: videos.length,
        lastMonthVideos: lastMonthData.videos,
      },
      books: {
        data: books.slice(0, 5),
        totalCount: books.length,
        lastMonthBooks: lastMonthData.books,
      },
      events: {
        data: events.slice(0, 5),
        totalCount: events.length,
        lastMonthEvents: lastMonthData.events,
      },
      institutions: {
        data: institutions.slice(0, 5),
        totalCount: institutions.length,
        lastMonthInstitutions: lastMonthData.institutions,
      },
      questions: {
        data: questions.slice(0, 5),
        totalCount: questions.length,
        lastMonthQuestions: lastMonthData.questions,
      },
      comments: {
        data: comments.slice(0, 5),
        totalCount: comments.length,
        lastMonthComments: lastMonthData.comments,
      },
      reviews: {
        data: reviews.slice(0, 5),
        totalCount: reviews.length,
        lastMonthReviews: lastMonthData.reviews,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard analytics:", error);
    return Response.json(
      { error: "Failed to fetch dashboard analytics" },
      { status: 500 }
    );
  }
}
