import { connect } from "@/lib/mongodb/mongoose";
import Event from "@/lib/models/Event";
import { clerkClient } from "@clerk/nextjs/server";

function getMatchingDates(start, end, weekdays) {
  const dates = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    if (weekdays.includes(d.getDay())) dates.push(new Date(d));
  }
  return dates;
}

async function fetchUserEmails(userIds, userIdToUser) {
  if (!userIds?.length) return [];
  const users = userIds.map((id) => userIdToUser.get(id)).filter(Boolean);
  return users
    .flatMap((u) => u.emailAddresses.map((e) => e.emailAddress))
    .filter(Boolean);
}

async function runAutoCreateWeeklies(allUsers, userIdToUser, scopeToUserIds) {
  const today = new Date();
  const nextMonth = new Date(today);
  nextMonth.setMonth(today.getMonth() + 1);

  const mainDays = getMatchingDates(today, nextMonth, [2, 4, 6]); // Tue, Thu, Sat
  const womenDays = getMatchingDates(today, nextMonth, [0]); // Sun
  const scope = "weekly";

  const notifyList = Array.from(scopeToUserIds[scope] || []);

  const existingEvents = await Event.find({
    startDate: { $gte: today, $lt: nextMonth },
    scope,
  }).select("startDate");
  const existingDates = new Set(
    existingEvents.map((e) => e.startDate.toDateString())
  );

  function dayBounds(d) {
    const start = new Date(d);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return [start, end];
  }

  const missingMainDates = mainDays.filter(
    (d) => !existingDates.has(d.toDateString())
  );
  for (const date of missingMainDates) {
    const [dayStart] = dayBounds(date);
    try {
      await Event.create({
        title: "তালিমের মাহফিল",
        description: `তারিখঃ (${date.toLocaleDateString()})\nআল্লামা মুহাম্মদ নিজাম উদ্দীন রশিদী\nখতিব-বহদ্দারহাট জামে মসজিদ\nমুহাদ্দিস -ছোবাহানিয়া আলিয়া কামিল মাদ্রাসা\nপ্রতিষ্ঠাতা :আত-তালিমুন নববী আলিম মাদ্রাসা`,
        startDate: dayStart,
        scope,
        location: "বহদ্দারহাট জামে মসজিদ, বহদ্দারহাট, চট্টগ্রাম",
        createdBy: "System Generated",
        scheduledTime: "2025-05-20T13:00:00.729+00:00",
        notifyList,
      });
    } catch (error) {
      console.error(`Error creating weekly event for ${date}:`, error);
    }
  }

  const missingWomenDates = womenDays.filter(
    (d) => !existingDates.has(d.toDateString())
  );
  for (const date of missingWomenDates) {
    const [dayStart] = dayBounds(date);
    try {
      await Event.create({
        title: "মহিলা তালিম",
        description: `তারিখঃ (${date.toLocaleDateString()})\nআল্লামা মুহাম্মদ নিজাম উদ্দীন রশিদী\nখতিব-বহদ্দারহাট জামে মসজিদ\nমুহাদ্দিস -ছোবাহানিয়া আলিয়া কামিল মাদ্রাসা\nপ্রতিষ্ঠাতা :আত-তালিমুন নববী আলিম মাদ্রাসা`,
        startDate: dayStart,
        scope,
        location:
          "আত্-তালীমুন নববী আলিম মাদ্রাসা, শুলকবহর, বহদ্দারহাট, চট্টগ্রাম",
        createdBy: "System Generated",
        scheduledTime: "2025-05-23T09:00:00.224+00:00",
      });
    } catch (error) {
      console.error(`Error creating women event for ${date}:`, error);
    }
  }
}

async function runMarkComplete() {
  const yesterdayEnd = new Date();
  yesterdayEnd.setHours(0, 0, 0, 0);
  await Event.updateMany(
    { startDate: { $lt: yesterdayEnd }, completed: false },
    { $set: { completed: true } }
  );
}

async function runDailyReminders(allUsers, userIdToUser, scopeToUserIds) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const events = await Event.find({
    canceled: false,
    completed: false,
    startDate: { $gte: today, $lt: tomorrow },
  }).lean();

  const emailPromises = [];
  for (const ev of events) {
    const allIds = new Set([
      ...(Array.isArray(ev.notificationWants) ? ev.notificationWants : []),
      ...(Array.isArray(ev.interestedUsers) ? ev.interestedUsers : []),
      ...(scopeToUserIds[ev.scope] || []),
    ]);
    if (!allIds.size) continue;

    const emails = await fetchUserEmails([...allIds], userIdToUser);
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
<html lang="en"><head><meta charset="UTF-8"/><title>Today’s Event Reminder</title></head>
<body style="margin:0;padding:0;background:#eef2f7;font-family:Arial,sans-serif">
  <table width="100%" style="max-width:600px;margin:20px auto;background:#fff;border-radius:8px;overflow:hidden">
    <tr><td style="background:#004d40;padding:30px;color:#fff;text-align:center">
      <h1 style="margin:0;font-size:24px">Today’s Event Reminder</h1>
    </td></tr>
    <tr><td style="padding:30px;color:#333;line-height:1.5">
      <p>Hello,</p>
      <p>Don’t forget <strong>${
        ev.title
      }</strong> today, <strong>${dateStr}</strong> at <strong>${timeStr}</strong>.</p>
      <p style="text-align:center;margin:24px 0">
        <a href="${detailsLink}" style="background:#00796b;color:#fff;padding:12px 24px;border-radius:4px;text-decoration:none;font-weight:bold">View Details</a>
      </p>
      <p>See you there!</p>
      <p>The At‑Taleem Team</p>
    </td></tr>
    <tr><td style="background:#eef2f7;padding:20px;text-align:center;font-size:12px;color:#666">
      © ${new Date().getFullYear()} At‑Taleem • <a href="https://taleembd.com" style="color:#004d40;text-decoration:none">Visit our site</a>
    </td></tr>
  </table>
</body></html>`;

    emailPromises.push(
      fetch(`${process.env.URL}/api/emails`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: emails,
          subject: `Reminder: ${ev.title} is today!`,
          html: eventHtml,
        }),
      })
    );
  }
  await Promise.all(emailPromises);
}

export async function GET(req) {
  if (
    req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new Response("Unauthorized", { status: 401 });
  }

  await connect();
  console.log("🏃 Starting daily cron…");

  const allUsers = (await clerkClient().users.getUserList()).data;

  const userIdToUser = new Map(allUsers.map((user) => [user.id, user]));
  const scopeToUserIds = {};
  allUsers.forEach((user) => {
    const eventPrefs = user.publicMetadata?.eventPrefs || {};
    Object.keys(eventPrefs).forEach((scope) => {
      if (eventPrefs[scope] === true) {
        if (!scopeToUserIds[scope]) scopeToUserIds[scope] = new Set();
        scopeToUserIds[scope].add(user.id);
      }
    });
  });

  await runAutoCreateWeeklies(allUsers, userIdToUser, scopeToUserIds);
  await runMarkComplete();
  await runDailyReminders(allUsers, userIdToUser, scopeToUserIds);

  console.log("✅ Daily cron complete");
  return new Response(null, { status: 204 });
}
