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

    const scheduledTime = ev.scheduledTime || "2025-05-20T13:00:00.729+00:00";
    const timeStr = new Date(scheduledTime).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Dhaka",
    });

    const detailsLink = `${process.env.URL}/programme/${ev._id}`;

    const eventHtml = `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>আজকের মাহফিলের রিমাইন্ডার</title>
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
            <td style="background-color: #004d40; padding: 30px; text-align: center;">
              <img src="cid:logo" alt="At-Taleem Logo" width="120" height="auto" style="max-width: 120px; margin-bottom: 15px;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #ffffff;">আজকের মাহফিলের রিমাইন্ডার</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td class="email-content" style="padding: 30px; color: #333333;">
              <p style="margin: 0 0 20px;">আসসালামু আলাইকুম,</p>
              <p style="margin: 0 0 20px;">কেমন আছেন?</p>
              <p style="margin: 0 0 20px;">মনে রাখবেন, <strong style="color: #004d40;">${
                ev.title
              }</strong> আজ, <strong style="color: #004d40;">${dateStr}</strong> তারিখ, সময়ঃ <strong style="color: #004d40;">${timeStr}</strong> টায় অনুষ্ঠিত হবে।</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${detailsLink}" style="display: inline-block; background-color: #00796b; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 4px; font-weight: 600; font-size: 16px;">বিস্তারিত দেখুন</a>
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
                <a href="https://taleembd.com" style="color: #004d40; text-decoration: none;">আমাদের ওয়েবসাইট দেখুন</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

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
