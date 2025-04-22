"use client";
"use client";
import { useState } from "react";
import { IoMdMail } from "react-icons/io";

export default function SendEmailModal({ recipientEmail, onClose }) {
  // State for modal inputs
  const [logoUrl, setLogoUrl] = useState(
    "https://at-taleem.vercel.app/favicon.png"
  );
  const [headline, setHeadline] = useState("Your Message from At-Taleem");
  const [body, setBody] = useState(
    "Thanks for joining us. Click below to get started."
  );
  const [footerText, setFooterText] = useState(
    "© 2025 At-Taleem. All rights reserved."
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSend = async () => {
    setLoading(true);
    setError(null);
    try {
      // Build the full HTML using the template
      const html = buildEmailTemplate({
        logoUrl,
        headline,
        message: body,
        footerText,
      });

      const res = await fetch("/api/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: recipientEmail,
          subject: headline || "Your Message from At-Taleem",
          html,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unknown error");
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-auto max-w-md h-5/6 w-full p-6 ">
        <button
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <IoMdMail className="text-blue-500" /> Send Custom Email
        </h2>
        {success ? (
          <p className="text-green-600">Email sent successfully!</p>
        ) : (
          <>
            {/* Headline input */}
            <label className="block mb-2">
              <span className="text-gray-700 dark:text-gray-300">
                Headline & Subject
              </span>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="Email Subject and Header"
                className="mt-1 block w-full border rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
              />
            </label>
            {/* Message body input */}
            <label className="block mb-2">
              <span className="text-gray-700 dark:text-gray-300">Message</span>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={4}
                placeholder="Your custom message here"
                className="mt-1 block w-full border rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 resize-none"
              />
            </label>
            {/* Footer text input */}
            <label className="block mb-4">
              <span className="text-gray-700 dark:text-gray-300">
                Footer Text
              </span>
              <input
                type="text"
                value={footerText}
                onChange={(e) => setFooterText(e.target.value)}
                placeholder="© 2025 At-Taleem. All rights reserved."
                className="mt-1 block w-full border rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
              />
            </label>
            {error && <p className="text-red-600 mb-2">{error}</p>}
            <button
              onClick={handleSend}
              disabled={loading || !headline || !body}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send Email"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// Example email HTML template
export const buildEmailTemplate = ({
  logoUrl,
  headline,
  message,
  footerText,
}) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; background-color: #f4f4f7; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; }
    .header { background: #1e40af; padding: 20px; text-align: center; }
    .header img { max-width: 120px; }
    .content { padding: 30px; color: #333333; }
    .headline { font-size: 24px; margin-bottom: 20px; }
    .message { font-size: 16px; line-height: 1.5; margin-bottom: 30px; }
    .footer { background: #f4f4f7; padding: 20px; text-align: center; font-size: 12px; color: #888888; }
    .btn { display: inline-block; padding: 12px 24px; background: #2563eb; color: #ffffff; text-decoration: none; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div style="background:#1e40af;padding:20px;text-align:center;">
      <img src="${logoUrl}"     alt="At‑Taleem Logo" style="max-width: 120px; height: auto; display: inline-block;"/>
    </div>
    <div class="content">
      <div class="headline">${headline}</div>
      <div class="message">${message}</div>
      <a href="#" class="btn">Visit Our Site</a>
    </div>
    <div class="footer">${footerText}</div>
  </div>
</body>
</html>
`;
