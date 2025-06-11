"use client";
import { useUser } from "@clerk/nextjs";
import dynamic from "next/dynamic";
import { useState } from "react";
import { IoMdMail } from "react-icons/io";
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });
import "react-quill-new/dist/quill.snow.css";

export default function SendEmailModal({
  defaultHeader,
  defaultBody,
  defaultFooter,
  recipientEmail,
  onClose,
  showSenderEmail = true,
  showHeader = true,
  showFooter = true,
  customButtonText = "Send Email",
  customSuccessMessage = "Email sent successfully!",
}) {
  // State for modal inputs
  const [logoUrl, setLogoUrl] = useState(
    "https://at-taleem.vercel.app/favicon.png"
  );
  const [headline, setHeadline] = useState(defaultHeader);
  const [body, setBody] = useState(defaultBody);
  const [footerText, setFooterText] = useState(defaultFooter);
  const [senderEmail, setSenderEmail] = useState("");
  const [senderName, setSenderName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const { user, isSignedIn } = useUser();

  const validateSubject = () => {
    if (!isSignedIn) {
      // Check if the subject contains the default placeholder
      if (headline.includes("Your Name")) {
        throw new Error("Please enter your name in the subject line");
      }
      // Check if the subject is empty or just whitespace
      if (!headline.trim()) {
        throw new Error("Please enter a subject for your email");
      }
    }
  };

  const handleSend = async () => {
    setLoading(true);
    setError(null);
    try {
      // Validate sender email for non-logged in users
      if (!isSignedIn && !senderEmail) {
        throw new Error("Please provide your email address");
      }

      if (!isSignedIn && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(senderEmail)) {
        throw new Error("Please enter a valid email address");
      }

      // Validate subject line
      validateSubject();

      // Build the full HTML using the template
      const html = buildEmailTemplate({
        logoUrl,
        headline,
        message: body,
        footerText,
      });

      const method =
        isSignedIn && user?.publicMetadata?.isAdmin ? "POST" : "PUT";
      const res = await fetch("/api/emails", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: recipientEmail,
          subject: headline || "Your Message from At-Taleem",
          userEmail: isSignedIn
            ? user.emailAddresses[0]?.emailAddress
            : senderEmail,
          html,
          senderName: isSignedIn ? user.fullName : senderEmail.split("@")[0],
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
      <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-auto max-w-md h-5/6 w-full p-6">
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
          <div className="text-center py-8">
            <p className="text-green-500 text-lg mb-4">
              {customSuccessMessage}
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            {/* Sender Email input for non-logged in users */}
            {showSenderEmail && !isSignedIn && (
              <div className="space-y-4 mb-4">
                <label className="block">
                  <span className="text-gray-700 dark:text-gray-300">
                    Your Email Address
                  </span>
                  <input
                    type="email"
                    value={senderEmail}
                    onChange={(e) => setSenderEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="mt-1 block w-full border rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                    required
                  />
                </label>
              </div>
            )}

            {/* Headline input */}
            {showHeader && (
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
                {!isSignedIn && headline.includes("Your Name") && (
                  <p className="text-red-500 text-sm mt-1">
                    Please enter your name in the subject line
                  </p>
                )}
              </label>
            )}

            {/* Message body input */}
            <label className="block mb-2">
              <span className="text-gray-700 dark:text-gray-300">Message</span>
              <div className="mt-1 block w-full border rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100">
                <ReactQuill
                  theme="snow"
                  placeholder="Your custom message here"
                  value={body}
                  className="h-[200px] mb-12"
                  onChange={setBody}
                />
              </div>
            </label>

            {/* Footer text input */}
            {showFooter && (
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
            )}

            {error && (
              <p className="text-red-600 mb-2 text-sm bg-red-50 dark:bg-red-900/20 p-2 rounded">
                {error}
              </p>
            )}

            <button
              onClick={handleSend}
              disabled={loading || !body || (!isSignedIn && !senderEmail)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Sending...
                </span>
              ) : (
                customButtonText
              )}
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
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:Arial,sans-serif;">
  <!-- outer wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center" style="padding:20px;">
        <!-- main container -->
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background:#fff;border-radius:8px;overflow:hidden;">
          
          <!-- header row -->
          <tr>
            <td style="background:#1e40af;padding:10px 20px;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <!-- logo (CID embedded) -->
                    <img src="cid:logo" width="40" height="40" alt="Logo" style="display:block;border:none; color:#09fc05" />
                  </td>
                  <td style="color:#fff;font-size:20px;font-weight:bold;padding-left:10px;vertical-align:middle;">
                    At-Taleem Official
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
         <tr>
  <td
    style="
      padding:30px;
      color:#333;
      line-height:1.5;
      /* remove pre-wrap here so the inner table can size to its content */
      white-space: normal !important;
      word-wrap: break-word;
      text-align: center;            /* center inline-table children */
    "
  >
    <h1 style="font-size:24px;margin:0 0 20px;">${headline}</h1>
    <h6 style="margin:0 0 30px;font-size:16px;">${message}</h6>

    <!-- standalone inline-table wrapper -->
    <table
      role="presentation"
      cellpadding="0"
      cellspacing="0"
      border="0"
      align="center"
      style="
        display: inline-table;        /* allow the table to shrink to its contents */
        margin: 0 auto 30px;
      "
    >
      <tr>
        <td
          align="center"
          bgcolor="#2563eb"
          style="border-radius:4px;"
        >
          <a
            href="https://at-taleem.vercel.app/"
            target="_blank"
            style="
              display: inline-block;
              padding: 12px 24px;
              font-size: 16px;
              color: #ffffff;
              text-decoration: none;
              border-radius: 4px;
            "
          >
            Visit Site
          </a>
        </td>
      </tr>
    </table>

  </td>
</tr>
          
          <!-- footer row -->
          <tr>
            <td style="background:#f4f4f7;padding:20px;text-align:center;font-size:12px;color:#888;">
              ${footerText}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
