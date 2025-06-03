import { NextResponse } from "next/server";
import Masalah from "@/lib/models/masalah";
import { connect } from "@/lib/mongodb/mongoose";
import { getAuth } from "@clerk/nextjs/server";

// GET /api/masalah - Get all masalah with pagination, filtering, and search
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    await connect();

    const query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { references: { $regex: search, $options: "i" } },
      ];
    }

    // Add category filter if provided
    if (category) {
      query.categories = category;
    }

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Execute query with pagination and sorting
    const masalah = await Masalah.find(query)
      .sort({ [sortBy]: sortOrder === "desc" ? -1 : 1 })
      .skip(skip)
      .limit(limit)
      .populate("categories", "name")
      .lean();

    // Get total count for pagination
    const total = await Masalah.countDocuments(query);

    return NextResponse.json({
      masalah,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching masalah:", error);
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
