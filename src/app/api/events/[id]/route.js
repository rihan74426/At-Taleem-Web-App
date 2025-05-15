// src/app/api/events/[id]/route.js
import { connect } from "@/lib/mongodb/mongoose";
import Event from "@/lib/models/Event";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

/**
 * GET /api/events/[id] - Get event by ID
 */
export async function GET(req, { params }) {
  try {
    await connect();
    const eventId = params.id;

    const event = await Event.findById(eventId).lean();
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
    const user = await currentUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!user.publicMetadata?.isAdmin) {
      return Response.json({ error: "Admin access required" }, { status: 403 });
    }

    const eventId = params.id;
    const updateData = await req.json();

    // Remove fields that shouldn't be directly updated
    const { _id, createdBy, createdAt, updatedAt, ...allowedUpdates } =
      updateData;

    const event = await Event.findById(eventId);
    if (!event) {
      return Response.json({ error: "Event not found" }, { status: 404 });
    }

    // Update the event
    Object.assign(event, allowedUpdates);
    await event.save();

    revalidatePath("/programme");
    revalidatePath(`/programme/${eventId}`);

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
    const user = await currentUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const eventId = params.id;
    const { action } = await req.json();

    const event = await Event.findById(eventId);
    if (!event) {
      return Response.json({ error: "Event not found" }, { status: 404 });
    }

    // Handle user actions
    switch (action) {
      case "toggleInterest":
        await handleToggleInterest(event, user.id);
        break;

      case "toggleAttendance":
        await handleToggleAttendance(event, user.id);
        break;

      case "toggleNotification":
        await handleToggleNotification(event, user.id);
        break;

      // Admin-only actions
      case "toggleComplete":
      case "toggleCancel":
      case "toggleFeatured":
        if (!user.publicMetadata?.isAdmin) {
          return Response.json(
            { error: "Admin access required" },
            { status: 403 }
          );
        }
        await handleAdminAction(event, action);
        break;

      default:
        return Response.json({ error: "Invalid action" }, { status: 400 });
    }

    await event.save();
    revalidatePath("/programme");
    revalidatePath(`/programme/${eventId}`);

    return Response.json({
      event,
      userStatus: {
        interested: event.interestedUsers.includes(user.id),
        attending: event.confirmedAttendees.includes(user.id),
        notified: event.notificationWants.includes(user.id),
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
    const user = await currentUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!user.publicMetadata?.isAdmin) {
      return Response.json({ error: "Admin access required" }, { status: 403 });
    }

    const eventId = params.id;
    const deletedEvent = await Event.findByIdAndDelete(eventId);

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
async function handleToggleInterest(event, userId) {
  const idx = event.interestedUsers.indexOf(userId);
  if (idx >= 0) {
    event.interestedUsers.splice(idx, 1);
  } else {
    event.interestedUsers.push(userId);
  }
}

async function handleToggleAttendance(event, userId) {
  if (
    !event.canRegister(userId) &&
    !event.confirmedAttendees.includes(userId)
  ) {
    throw new Error("Cannot register for this event");
  }

  const idx = event.confirmedAttendees.indexOf(userId);
  if (idx >= 0) {
    event.confirmedAttendees.splice(idx, 1);
  } else {
    event.confirmedAttendees.push(userId);
  }
}

async function handleToggleNotification(event, userId) {
  const idx = event.notificationWants.indexOf(userId);
  if (idx >= 0) {
    event.notificationWants.splice(idx, 1);
  } else {
    event.notificationWants.push(userId);
  }
}

async function handleAdminAction(event, action) {
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
