import { connect } from "@/lib/mongodb/mongoose";
import Event from "@/lib/models/Event";
import { clerkClient } from "@clerk/nextjs/server";

// Fetch emails for given user IDs, with array safety
async function fetchUserEmails(userIds, allUsers) {
  if (!userIds?.length) return [];
  const users = allUsers.filter((user) => userIds.includes(user.id));
  return users
    .flatMap((u) => u.emailAddresses.map((e) => e.emailAddress))
    .filter(Boolean);
}

// ### A) Admissions-Open Notification

// ### B) Auto-create weekly events for next month
function getMatchingDates(start, end, weekdays) {
  const dates = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    if (weekdays.includes(d.getDay())) dates.push(new Date(d));
  }
  return dates;
}

async function runAutoCreateWeeklies(allUsers) {
  const today = new Date();
  const nextMonth = new Date(today);
  nextMonth.setMonth(today.getMonth() + 1);

  const mainDays = getMatchingDates(today, nextMonth, [2, 4, 6]); // Tue, Thu, Sat
  const womenDays = getMatchingDates(today, nextMonth, [0]); // Sun
  const scope = "weekly";

  // Filter users with eventPrefs.weekly: true
  const prefsUsers = allUsers.filter(
    (user) => user.publicMetadata?.eventPrefs?.weekly === true
  );
  const notifyList = prefsUsers.map((u) => u.id);
  function dayBounds(d) {
    const start = new Date(d);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return [start, end];
  }
  for (const date of mainDays) {
    const [dayStart, dayEnd] = dayBounds(date);

    const existing = await Event.findOne({
      startDate: { $gte: dayStart, $lt: dayEnd },
      scope,
    });
    if (!existing) {
      try {
        await Event.create({
          title: "তালিমের মাহফিল",
          description: `তারিখঃ (${date.toLocaleDateString()})
          আল্লামা মুহাম্মদ নিজাম উদ্দীন রশিদী 
    খতিব-বহদ্দারহাট জামে মসজিদ 
    মুহাদ্দিস -ছোবাহানিয়া আলিয়া কামিল মাদ্রাসা 
    প্রতিষ্ঠাতা :আত-তালিমুন নববী আলিম মাদ্রাসা`,
          startDate: date,
          scope,
          location: "বহদ্দারহাট জামে মসজিদ, বহদ্দারহাট, চট্টগ্রাম",
          createdBy: "System Generated",
          scheduledTime: "2025-05-20T13:00:00.729+00:00",
          notifyList: notifyList,
        });
      } catch (error) {
        console.error(`Error cron: creating weekly event for ${date}:`, error);
      }
    }
  }

  for (const date of womenDays) {
    const [dayStart, dayEnd] = dayBounds(date);
    const existing = await Event.findOne({
      startDate: { $gte: dayStart, $lt: dayEnd },
      scope,
    });
    if (!existing) {
      try {
        await Event.create({
          title: "মহিলা তালিম",
          description: `তারিখঃ (${date.toLocaleDateString()})
    আল্লামা মুহাম্মদ নিজাম উদ্দীন রশিদী 
    খতিব-বহদ্দারহাট জামে মসজিদ 
    মুহাদ্দিস -ছোবাহানিয়া আলিয়া কামিল মাদ্রাসা 
    প্রতিষ্ঠাতা :আত-তালিমুন নববী আলিম মাদ্রাসা`,
          startDate: date,
          scope,
          location:
            "আত্-তালীমুন নববী আলিম মাদ্রাসা, শুলকবহর, বহদ্দারহাট, চট্টগ্রাম",
          createdBy: "System Generated",
          scheduledTime: "2025-05-23T09:00:00.224+00:00",
        });
      } catch (error) {
        console.log("error cron creating events", error);
      }
    }
  }
}

// ### C) Mark all past events complete
async function runMarkComplete() {
  const yesterdayEnd = new Date();
  yesterdayEnd.setHours(0, 0, 0, 0);

  await Event.updateMany(
    {
      startDate: { $lt: yesterdayEnd },
      completed: false,
    },
    { $set: { completed: true } }
  );
}

// ### D) Daily event-morning reminders
async function runDailyReminders(allUsers) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const events = await Event.find({
    canceled: false,
    completed: false,
    startDate: { $gte: today, $lt: tomorrow },
  }).lean();

  for (const ev of events) {
    // Filter users with eventPrefs[ev.scope]: true
    const prefsUsers = allUsers.filter(
      (user) => user.publicMetadata?.eventPrefs?.[ev.scope] === true
    );
    const prefsIds = prefsUsers.map((u) => u.id);

    const allIds = Array.from(
      new Set([
        ...(Array.isArray(ev.notificationWants) ? ev.notificationWants : []),
        ...(Array.isArray(ev.interestedUsers) ? ev.interestedUsers : []),
        ...prefsIds,
      ])
    );

    if (!allIds.length) continue;

    const emails = await fetchUserEmails(allIds, allUsers);
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
    <tr>
      <td style="background:#004d40;padding:30px;color:#fff;text-align:center">
        <h1 style="margin:0;font-size:24px">Today’s Event Reminder</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:30px;color:#333;line-height:1.5">
        <p>Hello,</p>
        <p>
          Don’t forget <strong>${ev.title}</strong> today,
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
        <p>The At‑Taleem Team</p>
      </td>
    </tr>
    <tr>
      <td style="background:#eef2f7;padding:20px;text-align:center;font-size:12px;color:#666">
        © ${new Date().getFullYear()} At‑Taleem •
        <a href="https://taleembd.com" style="color:#004d40;text-decoration:none">Visit our site</a>
      </td>
    </tr>
  </table>
</body></html>`;

    await fetch(`${process.env.URL}/api/emails`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: emails,
        subject: `Reminder: ${ev.title} is today!`,
        html: eventHtml,
      }),
    });
  }
}

// Single daily cron handler
export async function GET(req) {
  if (
    req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new Response("Unauthorized", { status: 401 });
  }

  await connect();
  console.log("🏃 Starting daily cron…");

  // Fetch all users once and reuse
  const allUsers = (await clerkClient.users.getUserList()).data;

  await runAutoCreateWeeklies(allUsers);
  await runMarkComplete();
  await runDailyReminders(allUsers);

  console.log("✅ Daily cron complete");
  return new Response(null, { status: 204 });
}
