import { connect } from "@/lib/mongodb/mongoose";
import Event from "@/lib/models/Event";
import { clerkClient } from "@clerk/nextjs/server";

/**
 * Helper: fetch all email addresses for a list of Clerk user IDs
 */
export async function fetchUserEmails(userIds) {
  const users = await clerkClient.users.getUserList({ userId: userIds });
  return users
    .flatMap((u) => u.emailAddresses.map((e) => e.emailAddress))
    .filter(Boolean);
}

export async function GET(req) {
  // authorize
  if (
    req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new Response(null, { status: 401 });
  }

  await connect();

  const now = new Date();
  const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);

  // look at scheduledTime (not startDate!)
  const events = await Event.find({
    canceled: false,
    reminderSent: { $ne: "hour" },
    scheduledTime: {
      $gte: new Date(inOneHour.getTime() - 5 * 60 * 1000),
      $lte: new Date(inOneHour.getTime() + 5 * 60 * 1000),
    },
  }).lean();

  for (let ev of events) {
    // who’s opted in via prefs?
    const { users: prefsUsers } = await clerkClient.users.getUserList({
      query: `publicMetadata.eventPrefs.${ev.scope}:true`,
    });
    const prefsIds = prefsUsers.map((u) => u.id);

    // merge with ad‑hoc notificationWants, dedupe:
    const recipients = Array.from(
      new Set([...prefsIds, ...(ev.notificationWants || [])])
    );
    if (!recipients.length) continue;

    // fetch their email addresses
    const emails = await fetchUserEmails(recipients);
    if (!emails.length) continue;

    // build our template
    const eventDate = new Date(ev.startDate).toLocaleDateString();
    const eventTime = new Date(ev.scheduledTime).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const detailsUrl = `${process.env.URL}/programme/${ev._id}`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><title>Event Reminder</title></head>
<body style="margin:0;padding:0;background:#f2f3f5;font-family:Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="margin:20px 0;background:#fff;border-radius:8px;overflow:hidden">
        <tr>
          <td style="background:#00695c;padding:20px;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:24px">At‑Taleem Reminder</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:30px;color:#333;line-height:1.5;font-size:16px;">
            <p>Hi there,</p>
            <p>
              Your event <strong>${ev.title}</strong> starts on
              <strong>${eventDate}</strong> at
              <strong>${eventTime}</strong>.
            </p>
            <p style="text-align:center;margin:30px 0">
              <a href="${detailsUrl}" style="
                background:#00796b;color:#fff;
                text-decoration:none;padding:12px 24px;
                border-radius:4px;font-weight:bold;
              ">
                View Event Details
              </a>
            </p>
            <p>If you have any questions, just reply to this email.</p>
            <p>Thanks,<br/>The At‑Taleem Team</p>
          </td>
        </tr>
        <tr>
          <td style="background:#eceff1;padding:15px;text-align:center;font-size:12px;color:#666">
            <p style="margin:0">
              © ${new Date().getFullYear()} At‑Taleem •
              <a href="https://taleembd.com" style="color:#00695c;text-decoration:none">Visit our site</a>
            </p>
            <p style="margin:5px 0 0">
              You’re receiving this because you subscribed to event reminders.
              If you’d rather not get these,
              <a href="${process.env.URL}/unsubscribe?eventId=${ev._id}"
                 style="color:#00695c;text-decoration:none">
                unsubscribe here
              </a>.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    // send reminder
    try {
      await fetch(`${process.env.URL}/api/emails`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: emails,
          subject: `Reminder: ${ev.title} starts in 1 hour`,
          html,
        }),
      });
      // mark as sent
      await Event.updateOne(
        { _id: ev._id },
        { $push: { reminderSent: "hour" } }
      );
    } catch (err) {
      console.error(`Failed to send reminder for ${ev._id}:`, err);
    }
  }

  return new Response(null, { status: 204 });
}
