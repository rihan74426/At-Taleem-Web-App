import { connect } from "@/lib/mongodb/mongoose";
import Event from "@/lib/models/Event";
import { getAuth, clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

/**
 * GET /api/events/[id] - Get event by ID
 */
export async function GET(req, { params }) {
  try {
    await connect();
    const { id } = await params;
    const event = await Event.findById(id).lean();
    if (!event) {
      return Response.json({ error: "Event not found" }, { status: 404 });
    }

    return Response.json({ event });
  } catch (error) {
    console.error("[API] Event GET by ID error:", error);
    return Response.json({ error: "Failed to fetch event" }, { status: 500 });
  }
}

/**
 * PUT /api/events/[id] - Update an event (admin only)
 */
export async function PUT(req, { params }) {
  try {
    await connect();
    const auth = getAuth(req);
    if (!auth.userId) {
      console.error("[API] PUT: No userId found in auth:", auth);
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await clerkClient().users.getUser(auth.userId);
    if (!user?.publicMetadata?.isAdmin) {
      console.error("[API] PUT: User is not admin:", auth.userId);
      return Response.json({ error: "Admin access required" }, { status: 403 });
    }

    const { id } = await params;
    const updateData = await req.json();

    const allowedFields = [
      "title",
      "description",
      "scope",
      "startDate",
      "scheduledTime",
      "seriesIndex",
      "location",
      "completed",
      "canceled",
      "featured",
    ];
    const updates = {};
    for (const key of allowedFields) {
      if (updateData[key] !== undefined) {
        updates[key] = updateData[key];
      }
    }

    const event = await Event.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!event) {
      return Response.json({ error: "Event not found" }, { status: 404 });
    }

    revalidatePath("/programme");
    revalidatePath(`/programme/${id}`);

    return Response.json({ event });
  } catch (error) {
    console.error("[API] Event PUT error:", error);
    return Response.json({ error: "Failed to update event" }, { status: 500 });
  }
}

/**
 * PATCH /api/events/[id] - Handle user interactions with events
 */
export async function PATCH(req, { params }) {
  try {
    await connect();
    const auth = getAuth(req);

    const { id } = await params;
    const { action } = await req.json();

    const event = await Event.findById(id);
    if (!event) {
      return Response.json({ error: "Event not found" }, { status: 404 });
    }

    // Handle user actions
    switch (action) {
      case "toggleInterest":
        handleToggleInterest(event, auth?.userId);
        break;

      case "toggleNotification":
        handleToggleNotification(event, auth?.userId);
        break;

      // Admin-only actions
      case "toggleComplete":
      case "toggleCancel":
      case "toggleFeatured":
        handleAdminAction(event, action);
        break;

      default:
        return Response.json({ error: "Invalid action" }, { status: 400 });
    }

    await event.save();
    revalidatePath("/programme");
    revalidatePath(`/programme/${id}`);

    return Response.json({
      event,
      userStatus: {
        interested: event.interestedUsers.includes(auth?.userId),
        notified: event.notificationWants.includes(auth?.userId),
      },
    });
  } catch (error) {
    console.error("[API] Event PATCH error:", error);
    return Response.json({ error: "Failed to update event" }, { status: 500 });
  }
}

/**
 * DELETE /api/events/[id] - Delete an event (admin only)
 */
export async function DELETE(req, { params }) {
  try {
    await connect();
    const { userId } = await req.json();
    if (!userId) {
      console.error("[API] DELETE: No userId found in auth:");
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await clerkClient().users.getUser(userId);
    if (!user?.publicMetadata?.isAdmin) {
      console.error("[API] DELETE: User is not admin:");
      return Response.json({ error: "Admin access required" }, { status: 403 });
    }

    const { id } = await params;
    const deletedEvent = await Event.findByIdAndDelete(id);

    if (!deletedEvent) {
      return Response.json({ error: "Event not found" }, { status: 404 });
    }

    revalidatePath("/programme");
    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[API] Event DELETE error:", error);
    return Response.json({ error: "Failed to delete event" }, { status: 500 });
  }
}

// Helper functions for handling event actions
function handleToggleInterest(event, userId) {
  const idx = event.interestedUsers.indexOf(userId);
  if (idx >= 0) {
    event.interestedUsers.splice(idx, 1);
  } else {
    event.interestedUsers.push(userId);
  }
}

function handleToggleNotification(event, userId) {
  const idx = event.notificationWants.indexOf(userId);
  if (idx >= 0) {
    event.notificationWants.splice(idx, 1);
  } else {
    event.notificationWants.push(userId);
  }
}

function handleAdminAction(event, action) {
  switch (action) {
    case "toggleComplete":
      event.completed = !event.completed;
      break;
    case "toggleCancel":
      event.canceled = !event.canceled;
      break;
    case "toggleFeatured":
      event.featured = !event.featured;
      break;
  }
}
