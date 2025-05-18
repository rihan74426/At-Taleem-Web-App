import { connect } from "@/lib/mongodb/mongoose";
import Event from "@/lib/models/Event";
import { clerkClient, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

/**
 * GET /api/events - Fetch events with filtering options
 */
export async function GET(req) {
  try {
    await connect();
    const { searchParams } = new URL(req.url);
    const filter = buildEventFilter(searchParams);

    // Pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Sorting
    const sortField = searchParams.get("sortBy") || "startDate";
    const sortOrder = searchParams.get("sortOrder") === "desc" ? -1 : 1;
    const sort = { [sortField]: sortOrder };

    // Execute query with pagination
    const [events, totalCount] = await Promise.all([
      Event.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      Event.countDocuments(filter),
    ]);

    return Response.json({
      events,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("[API] Event GET error:", error);
    return Response.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}

/**
 * POST /api/events - Create a new event or update user preferences
 */
export async function POST(req) {
  // const {createdBy}= req.body;
  // const user = await currentUser()
  try {
    await connect();
    const body = await req.json();
    if (body.eventPrefs) {
      const user = await clerkClient.users.getUser(body.userId);

      await clerkClient.users.updateUser(body.userId, {
        publicMetadata: {
          ...user?.publicMetadata,
          eventPrefs: body.eventPrefs,
        },
      });

      // Case 1: Update user preferences

      revalidatePath("/programme");
      return Response.json({ success: true }, { status: 200 });
    }
    const userId = body.createdBy;
    const user = await clerkClient.users.getUser(userId);
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Case 2: Create new event (admin only)
    if (!user?.publicMetadata?.isAdmin) {
      return Response.json({ error: "Admin access required" }, { status: 403 });
    }

    // Validate required fields
    const { title, scope, startDate } = body;
    if (!title || !scope || !startDate) {
      return Response.json(
        {
          error: "Missing required fields",
          requiredFields: ["title", "scope", "startDate"],
        },
        { status: 400 }
      );
    }

    // Find users who want notifications for this event scope
    const usersWithMatchingPrefs = await clerkClient.users.getUserList({
      query: `publicMetadata.eventPrefs.${scope}:true`,
    });
    const notifyList =
      usersWithMatchingPrefs.length > 0
        ? usersWithMatchingPrefs.map((u) => u.id)
        : [];

    // Create the event
    const eventData = {
      ...body,
      notificationWants: notifyList,
    };

    const event = await Event.create(eventData);

    revalidatePath("/programme");
    return Response.json({ event }, { status: 201 });
  } catch (error) {
    console.error("[API] Event POST error:", error);
    return Response.json({ error: "Failed to create event" }, { status: 500 });
  }
}

/**
 * Helper function to build event filter based on query parameters
 */
function buildEventFilter(searchParams) {
  const filter = {};

  // Basic filters
  if (searchParams.has("scope")) {
    filter.scope = searchParams.get("scope");
  }

  if (searchParams.has("featured")) {
    filter.featured = searchParams.get("featured") === "true";
  }

  if (searchParams.has("completed")) {
    filter.completed = searchParams.get("completed") === "true";
  }

  if (searchParams.has("canceled")) {
    filter.canceled = searchParams.get("canceled") === "true";
  }

  // Text search
  if (searchParams.has("search")) {
    const searchText = searchParams.get("search");
    filter.$or = [
      { title: { $regex: searchText, $options: "i" } },
      { description: { $regex: searchText, $options: "i" } },
      { location: { $regex: searchText, $options: "i" } },
    ];
  }

  // Date filters
  if (searchParams.has("date")) {
    const dateStr = searchParams.get("date");
    const date = new Date(dateStr);
    const nextDay = new Date(date);
    nextDay.setDate(date.getDate() + 1);

    filter.startDate = { $gte: date, $lt: nextDay };
  } else {
    if (searchParams.has("startAfter")) {
      filter.startDate = {
        ...filter.startDate,
        $gte: new Date(searchParams.get("startAfter")),
      };
    }

    if (searchParams.has("startBefore")) {
      filter.startDate = {
        ...filter.startDate,
        $lte: new Date(searchParams.get("startBefore")),
      };
    }
  }

  // User participation filters
  if (searchParams.has("createdBy")) {
    filter.createdBy = searchParams.get("createdBy");
  }

  if (searchParams.has("interestedUser")) {
    filter.interestedUsers = searchParams.get("interestedUser");
  }

  return filter;
}
