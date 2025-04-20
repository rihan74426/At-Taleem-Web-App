// pages/api/email/send.js
import nodemailer from "nodemailer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { to, subject, html } = req.body;
  if (!to || !subject || !html) {
    return res.status(400).json({ error: "Missing email parameters" });
  }

  // Create transporter (example: Gmail SMTP)
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST, // e.g. smtp.sendgrid.net
    port: process.env.SMTP_PORT, // e.g. 587
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    await transporter.sendMail({
      from: `"Your App" <${process.env.SMTP_FROM}>`,
      to,
      subject,
      html,
    });
    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Email send error:", err);
    res.status(500).json({ error: "Failed to send email" });
  }
}
