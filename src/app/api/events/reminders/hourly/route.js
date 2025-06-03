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
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>ভর্তি শুরু হয়েছে!</title>
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
<body style="margin: 0; padding: 0; background-color: #f4f4f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; font-size: 16px; line-height: 1.4; color: #333333;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table role="presentation" class="email-container" width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: #2563eb; padding: 40px; text-align: center;">
              <img src="cid:logo" alt="At-Taleem Logo" width="120" height="auto" style="max-width: 120px; margin-bottom: 15px;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 600; color: #ffffff;">ভর্তি শুরু হয়েছে!</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td class="email-content" style="padding: 30px; color: #333333;">
              <p style="margin: 0 0 20px;">আসসালামু আলাইকুম,</p>
              <p style="margin: 0 0 20px;">সুসংবাদ! <strong style="color: #2563eb;">At-Taleem</strong> এ ভর্তি শুরু হয়েছে। আপনার দক্ষতা বৃদ্ধি এবং বিশেষজ্ঞদের সাথে নেটওয়ার্কিং করার সুযোগ গ্রহণ করুন।</p>
              
              <ul style="margin: 20px 0; padding-left: 20px; color: #4b5563;">
                <li style="margin-bottom: 10px;">নমনীয় সময়সূচী</li>
                <li style="margin-bottom: 10px;">বিশেষজ্ঞ প্রশিক্ষক</li>
                <li style="margin-bottom: 10px;">ক্যারিয়ার সহায়তা</li>
              </ul>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${
                  process.env.URL
                }/institutions" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 4px; font-weight: 600; font-size: 16px;">এখনই আবেদন করুন</a>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f4f4f7; padding: 20px; text-align: center; font-size: 12px; color: #666666;">
              <p style="margin: 0 0 10px;">© ${new Date().getFullYear()} At-Taleem</p>
              <p style="margin: 0;">আপনি এই ইমেইল পাচ্ছেন কারণ আপনি আপডেটের জন্য সাইন আপ করেছেন।</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

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

// Note: fetchUserEmails is no longer needed since we'll fetch all users once and use a map

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
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>ইভেন্ট রিমাইন্ডার</title>
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
<body style="margin: 0; padding: 0; background-color: #f2f3f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; font-size: 16px; line-height: 1.4; color: #333333;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table role="presentation" class="email-container" width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: #00695c; padding: 30px; text-align: center;">
              <img src="cid:logo" alt="At-Taleem Logo" width="120" height="auto" style="max-width: 120px; margin-bottom: 15px;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #ffffff;">At-Taleem রিমাইন্ডার</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td class="email-content" style="padding: 30px; color: #333333;">
              <p style="margin: 0 0 20px;">আসসালামু আলাইকুম,</p>
              <p style="margin: 0 0 20px;">
                আপনার ইভেন্ট <strong style="color: #00695c;">${
                  ev.title
                }</strong> 
                <strong style="color: #00695c;">${eventDate}</strong> তারিখে 
                <strong style="color: #00695c;">${eventTime}</strong> এ শুরু হবে।
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${detailsUrl}" style="display: inline-block; background-color: #00796b; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 4px; font-weight: 600; font-size: 16px;">ইভেন্ট বিস্তারিত দেখুন</a>
              </div>
              
              <p style="margin: 0 0 20px;">যদি আপনার কোন প্রশ্ন থাকে, তাহলে এই ইমেইলে রিপ্লাই করুন।</p>
              <p style="margin: 0;">আল্লাহ হাফেজ,<br/>At-Taleem Team</p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #eceff1; padding: 20px; text-align: center; font-size: 12px; color: #666666;">
              <p style="margin: 0 0 10px;">© ${new Date().getFullYear()} At-Taleem</p>
              <p style="margin: 0 0 10px;">
                <a href="https://taleembd.com" style="color: #00695c; text-decoration: none;">আমাদের ওয়েবসাইট দেখুন</a>
              </p>
              <p style="margin: 0;">
                আপনি এই ইমেইল পাচ্ছেন কারণ আপনি ইভেন্ট রিমাইন্ডার সাবস্ক্রাইব করেছেন।
                <a href="${process.env.URL}/unsubscribe?eventId=${
        ev._id
      }" style="color: #00695c; text-decoration: none;">এখানে ক্লিক করে আনসাবস্ক্রাইব করুন</a>।
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
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
