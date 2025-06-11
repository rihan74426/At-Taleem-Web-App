import { NextResponse } from "next/server";
import Masalah from "@/lib/models/masalah";
import { connect } from "@/lib/mongodb/mongoose";
import { getAuth } from "@clerk/nextjs/server";
import "@/lib/models/Category"; // Import to register the model

// GET /api/masalah - Get all masalah with pagination, filtering, and search
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category"); // assume Masalah has a `categories` field if used
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? 1 : -1;

    await connect();

    // 1) Build a common "match" object based on search + category
    const match = {};
    if (search) {
      match.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { references: { $regex: search, $options: "i" } },
      ];
    }
    if (category) {
      match.categories = category;
    }

    // 2) If the client asked to sort by likeCount, use aggregation:
    if (sortBy === "likeCount") {
      const skip = (page - 1) * limit;

      const pipeline = [
        { $match: match },
        {
          $addFields: {
            likeCount: { $size: { $ifNull: ["$likers", []] } },
          },
        },
        {
          $sort: { likeCount: sortOrder, createdAt: -1 },
        },
        { $skip: skip },
        { $limit: limit },
        // If you want to populate “categories” (assuming it’s a ref to another collection):
        {
          $lookup: {
            from: "categories", // adjust collection name if different
            localField: "categories",
            foreignField: "_id",
            as: "categories",
          },
        },
        {
          $project: {
            // include all fields except internal __v; you can whitelist fields too
            __v: 0,
          },
        },
      ];

      // Run the aggregation:
      const docs = await Masalah.aggregate(pipeline);

      // We also need the total count (for pagination) matching the same filter:
      const total = await Masalah.countDocuments(match);

      return NextResponse.json({
        masalah: docs,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    }

    // 3) Otherwise, use a normal find() + sort() by some real field (e.g. createdAt, updatedAt, etc.)
    const skip = (page - 1) * limit;

    const docs = await Masalah.find(match)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .populate("categories", "name") // adjust as needed
      .lean();

    const total = await Masalah.countDocuments(match);

    return NextResponse.json({
      masalah: docs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching Masalah:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// POST /api/masalah - Create new masalah
export async function POST(request) {
  try {
    const { sessionId } = getAuth(request);

    if (!sessionId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.title || !body.description || !body.references) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await connect();

    const masalah = await Masalah.create({
      ...body,
      likers: [],
      comments: [],
    });

    return NextResponse.json(masalah, { status: 201 });
  } catch (error) {
    console.error("Error creating masalah:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
