// src/app/api/emails/route.js
import nodemailer from "nodemailer";

export async function POST(req) {
  // Parse JSON body
  let payload;
  try {
    payload = await req.json();
  } catch (err) {
    return new Response(JSON.stringify({ error: "Invalid JSON payload" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { to, subject, html } = payload;
  if (!to || !subject || !html) {
    return new Response(JSON.stringify({ error: "Missing email parameters" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Create transporter using Gmail SMTP (or adjust to your service)
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: false,
    auth: {
      user: process.env.APP_MAIL,
      pass: process.env.MAIL_PASS,
    },
  });

  try {
    // Send the email
    await transporter.sendMail({
      from: {
        name: "At-Taleem",
        address: process.env.APP_MAIL,
      },
      to,
      subject,
      html,
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Email send error:", err);
    return new Response(JSON.stringify({ error: "Failed to send email" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
