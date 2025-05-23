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

    // Get month/year from query params with defaults to current month/year
    const month =
      parseInt(searchParams.get("month")) || new Date().getMonth() + 1;
    const year = parseInt(searchParams.get("year")) || new Date().getFullYear();

    // Calculate month boundaries
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    // Build filter using the helper function, passing default month range
    const filter = buildEventFilter(searchParams, startDate, endDate);

    // Set sorting options
    const sortField = searchParams.get("sortBy") || "startDate";
    const sortOrder = searchParams.get("sortOrder") === "desc" ? -1 : 1;
    const sort = { [sortField]: sortOrder };

    // Fetch all events matching the filter (no pagination)
    const events = await Event.find(filter).sort(sort).lean();

    // Return events with month navigation info
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
  } catch (error) {
    console.error("[API] Event GET error:", error);
    return Response.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}

/**
 * POST /api/events - Create a new event or update user preferences
 */
export async function POST(req) {
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
 * @param {URLSearchParams} searchParams - Query parameters from the request
 * @param {Date} defaultStart - Start of the month
 * @param {Date} defaultEnd - End of the month
 * @returns {Object} MongoDB filter object
 */
function buildEventFilter(searchParams, defaultStart, defaultEnd) {
  const filter = {};

  // Handle date filters
  if (searchParams.has("date")) {
    const dateStr = searchParams.get("date");
    const date = new Date(dateStr);
    const nextDay = new Date(date);
    nextDay.setDate(date.getDate() + 1);
    filter.startDate = { $gte: date, $lt: nextDay };
  } else if (
    searchParams.has("startAfter") ||
    searchParams.has("startBefore")
  ) {
    if (searchParams.has("startAfter")) {
      filter.startDate = {
        $gte: new Date(searchParams.get("startAfter")),
      };
    }
    if (searchParams.has("startBefore")) {
      filter.startDate = {
        ...filter.startDate,
        $lte: new Date(searchParams.get("startBefore")),
      };
    }
  } else {
    // Default to the entire month if no specific date filters are provided
    filter.startDate = { $gte: defaultStart, $lte: defaultEnd };
  }

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

  // User participation filters
  if (searchParams.has("createdBy")) {
    filter.createdBy = searchParams.get("createdBy");
  }
  if (searchParams.has("interestedUser")) {
    filter.interestedUsers = searchParams.get("interestedUser");
  }

  return filter;
}
