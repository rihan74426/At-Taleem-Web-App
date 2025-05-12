// src/app/api/institutions/cron-open/route.js
import { connect } from "@/lib/mongodb/mongoose";
import Institution from "@/lib/models/Institution";
import nodemailer from "nodemailer";

export async function GET(req) {
  await connect();
  const auth = req.headers.get("Authorization") || "";
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const today = new Date();
  const toNotify = await Institution.find({
    admissionStatus: false,
    "admissionPeriod.openDate": { $lte: today },
  });

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: false,
    auth: {
      user: process.env.APP_MAIL,
      pass: process.env.MAIL_PASS,
    },
  });
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Admissions Now Open!</title>
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#f4f4f7;">
  <table role="presentation" width="100%" style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;">
    <!-- Hero image / color block -->
    <tr>
      <td style="background:#2563eb;padding:40px;text-align:center;color:#ffffff;font-family:Arial,sans-serif;">
        <h1 style="margin:0;font-size:28px;line-height:1.2;">Admissions Now Open!</h1>
        <p style="margin:8px 0 0;font-size:16px;opacity:0.9;">
          Join At-Taleem for an exceptional learning experience.
        </p>
      </td>
    </tr>

    <!-- Body content -->
    <tr>
      <td style="padding:30px;font-family:Arial,sans-serif;color:#333333;line-height:1.5;font-size:16px;">
        <p>Hello there,</p>
        <p>
          We’re thrilled to announce that admissions are now open for the upcoming session at
          <strong>At-Taleem</strong>. Whether you’re looking to expand your skills, explore new subjects,
          or join a supportive learning community, we have something for you.
        </p>
        <ul style="padding-left:20px;margin:16px 0;">
          <li>📝 Flexible course schedules</li>
          <li>🎓 Expert instructors</li>
          <li>💼 Career support & networking</li>
        </ul>
        <p style="text-align:center;margin:24px 0;">
          <a href="https://at-taleem.vercel.app/institutions" 
             style="display:inline-block;padding:14px 28px;background:#2563eb;color:#fff;
                    text-decoration:none;border-radius:4px;font-weight:bold;">
            Apply Now
          </a>
        </p>
        <p style="font-size:14px;color:#666666;margin:0;">
          If you have any questions, just reply to this email or contact our admissions team at
          <a href="mailto:admissions@at-taleem.com" style="color:#2563eb;">admissions@at-taleem.com</a>.
        </p>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background:#f4f4f7;padding:20px;text-align:center;font-family:Arial,sans-serif;font-size:12px;color:#888888;">
        © 2025 At-Taleem. All rights reserved.<br>
        You’re receiving this because you signed up for updates.
      </td>
    </tr>
  </table>
</body>
</html>
`;

  for (let inst of toNotify) {
    if (!inst.interestedEmails.length) continue;

    await transporter.sendMail({
      from: `"At-Taleem" <${process.env.SMTP_USER}>`,
      to: inst.interestedEmails,
      subject: `Admissions open now at ${inst.title}!`,
      html: html,
    });

    // mark open + clear list
    inst.admissionStatus = true;
    inst.interestedEmails = [];
    await inst.save();
  }

  return new Response(null, { status: 204 });
}
