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
    const { id } = await params;
    const { action, userId } = await req.json();

    const event = await Event.findById(id);
    if (!event) {
      return Response.json({ error: "Event not found" }, { status: 404 });
    }

    let wasCancelled = false;
    let wasUncancelled = false;

    // Handle user actions
    switch (action) {
      case "toggleInterest":
        handleToggleInterest(event, userId);
        break;

      case "toggleNotification":
        handleToggleNotification(event, userId);
        break;

      // Admin-only actions
      case "toggleComplete":
      case "toggleCancel":
      case "toggleFeatured":
        const user = await clerkClient.users.getUser(userId);
        if (!user?.publicMetadata?.isAdmin) {
          return Response.json(
            { error: "Admin access required" },
            { status: 403 }
          );
        }

        // Track cancellation state changes
        if (action === "toggleCancel") {
          wasCancelled = !event.canceled;
          wasUncancelled = event.canceled;
        }

        handleAdminAction(event, action);
        break;

      default:
        return Response.json({ error: "Invalid action" }, { status: 400 });
    }

    await event.save();

    // Send cancellation emails if the event was just cancelled
    if (wasCancelled) {
      const allIds = new Set([
        ...(Array.isArray(event.notificationWants)
          ? event.notificationWants
          : []),
        ...(Array.isArray(event.interestedUsers) ? event.interestedUsers : []),
      ]);

      if (allIds.size > 0) {
        const emails = await fetchUserEmails([...allIds]);
        await sendCancellationEmail(event, emails);
      }
    }

    revalidatePath("/programme");
    revalidatePath(`/programme/${id}`);

    return Response.json({
      event,
      userStatus: {
        interested: event.interestedUsers.includes(userId),
        notified: event.notificationWants.includes(userId),
      },
    });
  } catch (error) {
    console.error("[API] Event PATCH error:", error);
    return Response.json(
      {
        error: error.message || "Failed to update event",
      },
      { status: 500 }
    );
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
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await clerkClient.users.getUser(userId);
    if (!user?.publicMetadata?.isAdmin) {
      return Response.json({ error: "Admin access required" }, { status: 403 });
    }

    const { id } = params;
    const deletedEvent = await Event.findByIdAndDelete(id);

    if (!deletedEvent) {
      return Response.json({ error: "Event not found" }, { status: 404 });
    }

    revalidatePath("/programme");
    return Response.json(
      {
        success: true,
        message: "Event deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[API] Event DELETE error:", error);
    return Response.json(
      {
        error: error.message || "Failed to delete event",
      },
      { status: 500 }
    );
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

// Helper function to fetch user emails
async function fetchUserEmails(userIds) {
  if (!userIds?.length) return [];
  const users = await Promise.all(
    userIds.map((id) => clerkClient.users.getUser(id).catch(() => null))
  );
  return users
    .filter(Boolean)
    .flatMap((u) => u.emailAddresses.map((e) => e.emailAddress))
    .filter(Boolean);
}

// Helper function to send cancellation email
async function sendCancellationEmail(event, emails) {
  if (!emails.length) return;

  const dateStr = new Date(event.startDate).toLocaleDateString("bn-BD", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const scheduledTime = event.scheduledTime || "2025-05-20T13:00:00.729+00:00";
  const timeStr = new Date(scheduledTime).toLocaleTimeString("bn-BD", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Dhaka",
  });

  const eventHtml = `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>মাহফিল বাতিলের বিজ্ঞপ্তি</title>
  <style>
    @media only screen and (max-width: 600px) {
      .email-container {
        width: 100% !important;
      }
      .email-content {
        padding: 20px !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #eef2f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; font-size: 16px; line-height: 1.4; color: #333333;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table role="presentation" class="email-container" width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: #dc2626; padding: 30px; text-align: center;">
              <img src="cid:logo" alt="At-Taleem Logo" width="120" height="auto" style="max-width: 120px; margin-bottom: 15px;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #ffffff;">মাহফিল বাতিলের বিজ্ঞপ্তি</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td class="email-content" style="padding: 30px; color: #333333;">
              <p style="margin: 0 0 20px;">আসসালামু আলাইকুম,</p>
              <p style="margin: 0 0 20px;">দুঃখিত, আপনাকে জানাতে চাই যে <strong style="color: #dc2626;">${
                event.title
              }</strong> টি বাতিল করা হয়েছে।</p>
              <p style="margin: 0 0 20px;">মাহফিলটি ${dateStr} তারিখ, ${timeStr} টায় অনুষ্ঠিত হওয়ার কথা ছিল।</p>
              
              <div style="background-color: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; color: #dc2626;">
                  <strong>বাতিলের কারণ:</strong><br>
                  ${
                    event.cancelReason ||
                    "অপ্রত্যাশিত কারণে মাহফিলটি বাতিল করা হয়েছে।"
                  }
                </p>
              </div>
              
              <p style="margin: 0 0 20px;">আল্লাহ হাফেজ</p>
              <p style="margin: 0;">At-Taleem Team</p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #eef2f7; padding: 20px; text-align: center; font-size: 12px; color: #666666;">
              <p style="margin: 0 0 10px;">© ${new Date().getFullYear()} At-Taleem</p>
              <p style="margin: 0;">
                <a href="${
                  process.env.URL
                }" style="color: #004d40; text-decoration: none;">আমাদের ওয়েবসাইট দেখুন</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  try {
    await fetch(`${process.env.URL}/api/emails`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: emails,
        subject: `বাতিল: ${event.title}`,
        html: eventHtml,
      }),
    });
  } catch (error) {
    console.error("Error sending cancellation email:", error);
  }
}
