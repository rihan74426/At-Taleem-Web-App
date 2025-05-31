import { connect } from "@/lib/mongodb/mongoose";
import Event from "@/lib/models/Event";
import { clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

/**
 * GET /api/events - Fetch events with filtering options
 */
export async function GET(req) {
  try {
    await connect();
    const { searchParams } = new URL(req.url);

    // Common parameters
    const sortField = searchParams.get("sortBy") || "startDate";
    const sortOrder = searchParams.get("sortOrder") === "desc" ? -1 : 1;
    const sort = { [sortField]: sortOrder };
    const filter = buildEventFilter(searchParams);

    // Determine if this is a calendar view request
    const hasCalendarParams =
      searchParams.has("month") || searchParams.has("year");
    const isCalendarView = hasCalendarParams || !searchParams.has("page");

    if (isCalendarView) {
      // Calendar view handling
      const month =
        parseInt(searchParams.get("month")) || new Date().getMonth() + 1;
      const year =
        parseInt(searchParams.get("year")) || new Date().getFullYear();

      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      const events = await Event.find({
        ...filter,
        startDate: { $gte: startDate, $lte: endDate },
      })
        .sort(sort)
        .lean();

      return Response.json({
        events,
        monthInfo: {
          currentMonth: month,
          currentYear: year,
          nextMonth: month === 12 ? 1 : month + 1,
          nextYear: month === 12 ? year + 1 : year,
          prevMonth: month === 1 ? 12 : month - 1,
          prevYear: month === 1 ? year - 1 : year,
        },
      });
    }

    // List view handling with pagination
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 20;
    const skip = (page - 1) * limit;

    const [total, events] = await Promise.all([
      Event.countDocuments(filter),
      Event.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    ]);

    return Response.json({
      events,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
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

  // Scope-based filtering
  if (searchParams.has("scope")) {
    const scope = searchParams.get("scope");
    // Only add scope filter if it's not null
    if (scope !== "null") {
      filter.scope = scope;
    }
  }

  // Basic filters
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

  // Calendar view date filters
  if (searchParams.has("month") && searchParams.has("year")) {
    const month = parseInt(searchParams.get("month"));
    const year = parseInt(searchParams.get("year"));
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    filter.startDate = { $gte: startDate, $lte: endDate };
  }

  return filter;
}
