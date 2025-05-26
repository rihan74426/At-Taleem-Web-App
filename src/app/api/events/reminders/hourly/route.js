import { connect } from "@/lib/mongodb/mongoose";
import Event from "@/lib/models/Event";
import { clerkClient } from "@clerk/nextjs/server";
import Institution from "@/lib/models/Institution";

async function runOpenAdmissions() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const insts = await Institution.find({
    admissionStatus: false,
    "admissionPeriod.openDate": { $lte: new Date() },
  });

  const admissionsHtml = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><title>Admissions Now Open!</title></head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:Arial,sans-serif">
  <table role="presentation" width="100%" style="max-width:600px;margin:20px auto;background:#fff;border-radius:8px;overflow:hidden">
    <tr>
      <td style="background:#2563eb;padding:40px;text-align:center;color:#fff">
        <h1 style="margin:0;font-size:28px">Admissions Now Open!</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:30px;color:#333;line-height:1.5">
        <p>Good news!</p>
        <p>Admissions are now open at <strong>At-Taleem</strong>.  
           Join us to expand your skills and network with experts.</p>
        <ul style="margin:16px 0 16px 20px">
          <li>Flexible schedules</li>
          <li>Expert instructors</li>
          <li>Career support</li>
        </ul>
        <p style="text-align:center">
          <a href="${process.env.URL}/institutions"
             style="background:#2563eb;color:#fff;padding:12px 24px;border-radius:4px;
                    text-decoration:none;font-weight:bold">
            Apply Now
          </a>
        </p>
      </td>
    </tr>
    <tr>
      <td style="background:#f4f4f7;padding:20px;text-align:center;font-size:12px;color:#888">
        © ${new Date().getFullYear()} At-Taleem. You're receiving this because you signed up for updates.
      </td>
    </tr>
  </table>
</body></html>`;

  // Process all institutions concurrently
  const emailPromises = insts.map(async (inst) => {
    if (!inst.interestedEmails?.length) return;
    const emails = inst.interestedEmails;
    try {
      await fetch(`${process.env.URL}/api/emails`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: emails,
          subject: `Admissions open now at ${inst.title}!`,
          html: admissionsHtml,
        }),
      });
      inst.admissionStatus = true;
      await inst.save();
    } catch (err) {
      console.error(`Failed admissions email for ${inst._id}:`, err);
    }
  });

  await Promise.all(emailPromises);
}

// Note: fetchUserEmails is no longer needed since we’ll fetch all users once and use a map

export async function GET(req) {
  // Authorize
  if (
    req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new Response(null, { status: 401 });
  }

  await connect();

  // Fetch all users once and build lookup maps
  const allUsers = (await clerkClient.users.getUserList()).data;
  const userMap = new Map(allUsers.map((user) => [user.id, user]));
  const scopeToUserIds = {};
  allUsers.forEach((user) => {
    const eventPrefs = user.publicMetadata?.eventPrefs || {};
    Object.keys(eventPrefs).forEach((scope) => {
      if (eventPrefs[scope] === true) {
        if (!scopeToUserIds[scope]) scopeToUserIds[scope] = [];
        scopeToUserIds[scope].push(user.id);
      }
    });
  });

  // Run admissions task
  await runOpenAdmissions();

  // Find events needing reminders
  const now = new Date();
  const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);
  const events = await Event.find({
    canceled: false,
    reminderSent: { $ne: "hour" },
    scheduledTime: {
      $gte: new Date(inOneHour.getTime() - 5 * 60 * 1000),
      $lte: new Date(inOneHour.getTime() + 5 * 60 * 1000),
    },
  }).lean();

  // Process all events concurrently
  const reminderPromises = events.map(async (ev) => {
    try {
      // Get user IDs from precomputed scope map and notificationWants
      const prefsIds = scopeToUserIds[ev.scope] || [];
      const allIds = Array.from(
        new Set([...prefsIds, ...(ev.notificationWants || [])])
      );
      if (!allIds.length) return;

      // Extract emails from userMap
      const emails = allIds
        .map((id) => userMap.get(id))
        .filter(Boolean)
        .flatMap((u) => u.emailAddresses.map((e) => e.emailAddress))
        .filter(Boolean);
      if (!emails.length) return;

      // Build HTML template
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

      // Send email and update event
      await fetch(`${process.env.URL}/api/emails`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: emails,
          subject: `Reminder: ${ev.title} starts in 1 hour`,
          html,
        }),
      });
      await Event.updateOne(
        { _id: ev._id },
        { $push: { reminderSent: "hour" } }
      );
    } catch (err) {
      console.error(`Failed to send reminder for ${ev._id}:`, err);
    }
  });

  await Promise.all(reminderPromises);

  return new Response(null, { status: 204 });
}
