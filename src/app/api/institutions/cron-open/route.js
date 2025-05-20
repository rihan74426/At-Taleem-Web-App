// src/app/api/cron/route.js
import { connect } from "@/lib/mongodb/mongoose";
import Institution from "@/lib/models/Institution";
import Event from "@/lib/models/Event";
import { clerkClient } from "@clerk/nextjs/server";

async function fetchUserEmails(userIds) {
  if (!userIds?.length) return [];
  const { users } = await clerkClient.users.getUserList({ userId: userIds });
  return users
    .flatMap((u) => u.emailAddresses.map((e) => e.emailAddress))
    .filter(Boolean);
}

export async function GET(req) {
  // 1) AUTH
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  await connect();

  // 2) TODAY'S DATE BOUNDARIES
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  //
  // —— A) Admissions-Open Notifications ——
  //
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

  for (let inst of insts) {
    if (!inst.interestedEmails?.length) continue;
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
      inst.interestedEmails = [];
      await inst.save();
    } catch (err) {
      console.error(`Failed admissions email for ${inst._id}:`, err);
    }
  }

  //
  // —— B) Morning Event Reminders ——
  //
  // find events happening today
  const events = await Event.find({
    canceled: false,
    completed: false,
    startDate: { $gte: today, $lt: tomorrow },
  }).lean();

  for (let ev of events) {
    // build full recipient list: prefs + ad-hoc + interested
    const { users: prefs } = await clerkClient.users.getUserList({
      query: `publicMetadata.eventPrefs.${ev.scope}:true`,
    });
    const prefsIds = prefs.map((u) => u.id);

    const allIds = Array.from(
      new Set([
        ...(ev.notificationWants || []),
        ...(ev.interestedUsers || []),
        ...prefsIds,
      ])
    );
    if (!allIds.length) continue;

    const emails = await fetchUserEmails(allIds);
    if (!emails.length) continue;

    const dateStr = new Date(ev.startDate).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const timeStr = new Date(
      ev.scheduledTime || ev.startDate
    ).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const detailsLink = `${process.env.URL}/programme/${ev._id}`;

    const eventHtml = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><title>Today's Event Reminder</title></head>
<body style="margin:0;padding:0;background:#eef2f7;font-family:Arial,sans-serif">
  <table width="100%" style="max-width:600px;margin:20px auto;background:#fff;border-radius:8px;overflow:hidden">
    <tr>
      <td style="background:#004d40;padding:30px;color:#fff;text-align:center">
        <h1 style="margin:0;font-size:24px">Today's Event Reminder</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:30px;color:#333;line-height:1.5">
        <p>Hello,</p>
        <p>
          Don't forget <strong>${ev.title}</strong> today,
          <strong>${dateStr}</strong> at <strong>${timeStr}</strong>.
        </p>
        <p style="text-align:center;margin:24px 0">
          <a href="${detailsLink}"
             style="background:#00796b;color:#fff;padding:12px 24px;border-radius:4px;
                    text-decoration:none;font-weight:bold">
            View Details
          </a>
        </p>
        <p>See you there!</p>
        <p>The At-Taleem Team</p>
      </td>
    </tr>
    <tr>
      <td style="background:#eef2f7;padding:20px;text-align:center;font-size:12px;color:#666">
        © ${new Date().getFullYear()} At-Taleem •
        <a href="https://taleembd.com" style="color:#004d40;text-decoration:none">Visit our site</a>
      </td>
    </tr>
  </table>
</body></html>`;

    try {
      await fetch(`${process.env.URL}/api/emails`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: emails,
          subject: `Reminder: ${ev.title} is today!`,
          html: eventHtml,
        }),
      });
      // you could also mark completed after end time—but here we just send
    } catch (err) {
      console.error(`Failed reminder for event ${ev._id}:`, err);
    }
  }

  return new Response(null, { status: 204 });
}
