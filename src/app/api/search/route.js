import { connect } from "@/lib/mongodb/mongoose";
import Book from "@/lib/models/Book";
import Event from "@/lib/models/Event";
import Videos from "@/lib/models/Videos";
import Question from "@/lib/models/Question";
import Institution from "@/lib/models/Institution";
import Category from "@/lib/models/Category";
import Masalah from "@/lib/models/masalah";

export async function GET(req) {
  try {
    await connect();
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const limit = parseInt(searchParams.get("limit")) || 5;

    if (!query) {
      return Response.json({ success: true, results: [] });
    }

    // Create regex for case-insensitive search
    const searchRegex = new RegExp(query, "i");

    // First, find matching categories
    const matchingCategories = await Category.find({
      name: searchRegex,
    })
      .select("_id")
      .lean();

    const categoryIds = matchingCategories.map((cat) => cat._id);

    // Search across multiple models in parallel
    const [books, events, videos, questions, institutions, masalahs] =
      await Promise.all([
        // Search in books
        Book.find({
          $or: [
            { title: searchRegex },
            { description: searchRegex },
            { author: searchRegex },
          ],
        })
          .select("title description author _id")
          .limit(limit)
          .lean(),

        // Search in events
        Event.find({
          $or: [
            { title: searchRegex },
            { description: searchRegex },
            { location: searchRegex },
          ],
        })
          .select("title description location startDate _id")
          .limit(limit)
          .lean(),

        // Search in videos
        Videos.find({
          $or: [
            { title: searchRegex },
            { description: searchRegex },
            { category: { $in: categoryIds } },
          ],
        })
          .select("title description category thumbnailUrl _id")
          .limit(limit)
          .lean(),

        // Search in questions
        Question.find({
          $or: [
            { title: searchRegex },
            { description: searchRegex },
            { answer: searchRegex },
            { category: { $in: categoryIds } },
          ],
        })
          .select("title description answer category _id")
          .limit(limit)
          .lean(),

        // Search in institutions
        Institution.find({
          $or: [
            { name: searchRegex },
            { description: searchRegex },
            { location: searchRegex },
          ],
        })
          .select("name description location _id")
          .limit(limit)
          .lean(),

        // Search in masalah
        Masalah.find({
          $or: [
            { title: searchRegex },
            { description: searchRegex },
            { references: searchRegex },
          ],
        })
          .select("title description references _id")
          .limit(limit)
          .lean(),
      ]);

    // Format results with type information
    const results = [
      ...books.map((book) => ({
        ...book,
        type: "book",
        route: `/published-books/${book._id}`,
      })),
      ...events.map((event) => ({
        ...event,
        type: "event",
        route: `/programme?event=${event._id}`,
      })),
      ...videos.map((video) => ({
        ...video,
        type: "video",
        route: `${video.category.toLowerCase()}-videos/${video._id}`,
      })),
      ...questions.map((question) => ({
        ...question,
        type: "question",
        route: `/questionnaires/${question._id}`,
      })),
      ...institutions.map((institution) => ({
        ...institution,
        type: "institution",
        route: `/institutions/${institution._id}`,
      })),
      ...masalahs.map((masalah) => ({
        ...masalah,
        type: "masalah",
        route: `/masalah/${masalah._id}`,
      })),
    ];

    // Sort results by relevance (you can implement more sophisticated sorting)
    results.sort((a, b) => {
      const aTitle = a.title || a.name || a.question;
      const bTitle = b.title || b.name || b.question;
      return aTitle.localeCompare(bTitle);
    });

    return Response.json({ success: true, results });
  } catch (error) {
    console.error("[API] Search error:", error);
    return Response.json(
      { success: false, error: "Failed to perform search" },
      { status: 500 }
    );
  }
}
