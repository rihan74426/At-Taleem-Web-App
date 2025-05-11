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
}) {
  // State for modal inputs
  const [logoUrl, setLogoUrl] = useState(
    "https://at-taleem.vercel.app/favicon.png"
  );
  const [headline, setHeadline] = useState(defaultHeader);
  const [body, setBody] = useState(defaultBody);
  const [footerText, setFooterText] = useState(defaultFooter);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const user = useUser();
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
            {user.user.publicMetadata.isAdmin && (
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
            )}
            {/* Message body input */}
            <label className="block mb-2">
              <span className="text-gray-700 dark:text-gray-300">Message</span>
              <ReactQuill
                theme="snow"
                placeholder="Your custom message here"
                value={body}
                className="mt-1 block w-full border rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 resize-none"
                onChange={setBody}
              />
            </label>
            {/* Footer text input */}
            {user.user.publicMetadata.isAdmin && (
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
