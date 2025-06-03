// src/app/api/emails/route.js
import path from "path";
import nodemailer from "nodemailer";
import fs from "fs/promises";

// Shared configuration
const EMAIL_CONFIG = {
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587", 10),
  secure: false,
  auth: {
    user: process.env.APP_MAIL,
    pass: process.env.MAIL_PASS,
  },
};

// Create reusable transporter
const createTransporter = () => {
  return nodemailer.createTransport(EMAIL_CONFIG);
};

// Shared error response
const errorResponse = (message, status = 400) => {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
};

// Shared success response
const successResponse = () => {
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

// Get logo attachment
const getLogoAttachment = async () => {
  try {
    const logoPath = path.join(process.cwd(), "public", "favicon.png");
    await fs.access(logoPath); // Check if file exists
    return {
      filename: "favicon.png",
      path: logoPath,
      cid: "logo",
    };
  } catch (error) {
    console.warn("Logo file not found, emails will be sent without logo");
    return null;
  }
};

export async function POST(req) {
  try {
    const payload = await req.json();
    const { to, subject, html } = payload;

    if (!to || !subject || !html) {
      return errorResponse("Missing email parameters");
    }

    const transporter = createTransporter();
    const logoAttachment = await getLogoAttachment();

    await transporter.sendMail({
      from: {
        name: "At-Taleem Support",
        address: process.env.APP_MAIL || `noreply@${process.env.URL}`,
      },
      to,
      subject,
      html,
      attachments: logoAttachment ? [logoAttachment] : [],
    });

    return successResponse();
  } catch (err) {
    console.error("Email send error:", err);
    return errorResponse("Failed to send email", 500);
  }
}

export async function PUT(req) {
  try {
    const payload = await req.json();
    const { to, subject, userEmail, html } = payload;

    if (!to || !subject || !html) {
      return errorResponse("Missing email parameters");
    }

    const transporter = createTransporter();
    const logoAttachment = await getLogoAttachment();

    await transporter.sendMail({
      from: {
        name: "At-Taleem Contact",
        address: process.env.APP_MAIL || `noreply@${process.env.URL}`,
      },
      to,
      replyTo: userEmail,
      subject,
      html,
      attachments: logoAttachment ? [logoAttachment] : [],
    });

    return successResponse();
  } catch (err) {
    console.error("Email send error:", err);
    return errorResponse("Failed to send email", 500);
  }
}
