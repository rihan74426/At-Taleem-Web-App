import { connect } from "@/lib/mongodb/mongoose";
import Event from "@/lib/models/Event";
import { clerkClient } from "@clerk/nextjs/server";

export async function fetchUserEmails(userIds) {
  const users = await clerkClient.users.getUserList({
    userId: userIds,
  });
  return users
    .flatMap((u) => u.emailAddresses.map((e) => e.emailAddress))
    .filter(Boolean);
}

export async function GET(req) {
  if (
    req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new Response(null, { status: 401 });
  }
  await connect();
  const now = new Date();
  const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);

  // find events that start within [inOneHour ± 5min], haven't been reminded
  const events = await Event.find({
    canceled: false,
    reminderSent: { $ne: "hour" },
    scheduledTime: {
      $gte: new Date(inOneHour.getTime() - 5 * 60 * 1000),
      $lte: new Date(inOneHour.getTime() + 5 * 60 * 1000),
    },
  }).lean();

  for (let ev of events) {
    const usersWithMatchingPrefs = await clerkClient.users.getUserList({
      query: `publicMetadata.eventPrefs.${ev.scope}:true`,
    });
    const notifyList =
      usersWithMatchingPrefs.length > 0
        ? usersWithMatchingPrefs.map((u) => u.id)
        : [];
    const recipients = Array.from(
      new Set([...notifyList, ...(ev.notificationWants || [])])
    );
    if (recipients.length === 0) continue;
    const emails = await fetchUserEmails(recipients);
    const html = `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>Event Reminder</title>
    </head>
    <body style="margin:0;padding:0;background-color:#f2f3f5;font-family:Arial,sans-serif;">
      <!-- Container -->
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="margin:20px 0;background:white;border-radius:8px;overflow:hidden;">
              
              <!-- Header -->
              <tr>
                <td style="background-color:#00695c;padding:20px;text-align:center;">
                  <h1 style="color:white;font-size:24px;margin:0;">At‑Taleem Reminder</h1>
                </td>
              </tr>
              
              <!-- Body -->
              <tr>
                <td style="padding:30px;color:#333333;line-height:1.5;font-size:16px;">
                  <p>Hi there,</p>
                  <p>
                    This is a friendly reminder that your event  
                    <strong>${ev.title}</strong>  
                    is coming up on  
                    <strong>${new Date(
                      ev.startDate
                    ).toLocaleDateString()}</strong>  
                    at  
                    <strong>${new Date(ev.scheduledTime).getTime()}</strong>.
                  </p>
                  <p>
                    You can join via the usual link, or check your dashboard for more details.
                  </p>
                  <p style="text-align:center;margin:30px 0;">
                    <a 
                      href=${process.env.URL / programme / ev._id} 
                      style="
                        background-color:#00796b;
                        color:white;
                        text-decoration:none;
                        padding:12px 24px;
                        border-radius:4px;
                        display:inline-block;
                        font-weight:bold;
                      ">
                      View Event Details
                    </a>
                  </p>
                  <p>If you have any questions, just reply to this email and we’ll help out.</p>
                  <p>Thanks,<br/>The At‑Taleem Team</p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color:#eceff1;padding:15px;text-align:center;font-size:12px;color:#666;">
                  <p style="margin:0;">
                    © ${new Date().getFullYear()} At‑Taleem &bull;  
                    <a href="https://taleembd.com" style="color:#00695c;text-decoration:none;">Visit our site</a>
                  </p>
                  <p style="margin:5px 0 0;">
                    You’re receiving this because you subscribed to event reminders.
                    <br/>
                    If you’d rather not get these, you can  
                    <a href=${
                      process.env.URL + "/programme"
                    } style="color:#00695c;text-decoration:none;">unsubscribe here</a>.
                  </p>
                </td>
              </tr>
    
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>`;

    await fetch(`${process.env.URL}/api/emails`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: emails,
        subject: `Reminder: ${ev.title} starts in 1 hour`,
        html,
      }),
    });

    // mark reminderSent
    await Event.updateOne({ _id: ev._id }, { $push: { reminderSent: "hour" } });
  }
  return new Response(null, { status: 204 });
}
