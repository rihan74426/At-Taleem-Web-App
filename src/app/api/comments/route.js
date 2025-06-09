import Comment from "@/lib/models/Comment";
import { connect } from "@/lib/mongodb/mongoose";
import { clerkClient } from "@clerk/nextjs/server";

export async function GET(request) {
  await connect();
  const { searchParams } = new URL(request.url);
  const entityId = searchParams.get("entityId");
  const commentType = searchParams.get("commentType"); // "video" or "question"

  if (!entityId || !commentType) {
    return new Response(
      JSON.stringify({ error: "Missing entityId or commentType" }),
      {
        status: 400,
      }
    );
  }

  try {
    const comments = await Comment.find({
      entityId,
      commentType,
      parentComment: null,
    })
      .populate({
        path: "replies",
        options: { sort: { createdAt: +1 } },
      })
      .sort({ createdAt: +1 });

    return new Response(JSON.stringify({ comments }), { status: 200 });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Error fetching comments", details: error }),
      { status: 500 }
    );
  }
}

export async function POST(request) {
  await connect();
  const data = await request.json();

  if (
    !data.entityId ||
    !data.commentType ||
    !data.userId ||
    !data.username ||
    !data.content
  ) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), {
      status: 400,
    });
  }

  const newComment = await Comment.create({
    entityId: data.entityId, // Can be a videoId or questionId
    commentType: data.commentType, // "video" or "question"
    userId: data.userId,
    username: data.username,
    content: data.content,
    parentComment: data.parentComment || null,
  });

  if (data.parentComment) {
    await Comment.findByIdAndUpdate(data.parentComment, {
      $push: { replies: newComment._id },
    });
  }

  return new Response(JSON.stringify(newComment), { status: 201 });
}

const generateEmailHtml = (comment, likesCount) => {
  const milestone = Math.floor(likesCount / 10) * 10;

  // Determine the correct URL based on commentType
  const getEntityUrl = (commentType, entityId) => {
    switch (commentType) {
      case "video":
        return `${process.env.URL}/video/${entityId}`;
      case "question":
        return `${process.env.URL}/questions/${entityId}`;
      case "book":
        return `${process.env.URL}/books/${entityId}`;
      case "masalah":
        return `${process.env.URL}/masalah/${entityId}`;
      default:
        return process.env.URL;
    }
  };

  const entityUrl = getEntityUrl(comment.commentType, comment.entityId);
  const isReply = Boolean(comment.parentComment);
  const commentType = isReply ? "রিপ্লাইটি" : "কমেন্টটি";

  return `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <meta name="format-detection" content="telephone=no">
  <meta name="x-apple-disable-message-reformatting">
  <title>অভিনন্দন: আপনার ${commentType} ${milestone} জন মানুষ পছন্দ করেছেন!</title>
  <style>
    /* Base styles */
    body, table, td, div, p, a, span {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    body {
      margin: 0;
      padding: 0;
      background-color: #f4f4f4;
      color: #333333;
      font-size: 16px;
      line-height: 1.6;
    }
    table {
      border-spacing: 0;
      border-collapse: collapse;
    }
    td {
      padding: 0;
    }
    img {
      border: 0;
      line-height: 100%;
      outline: none;
      text-decoration: none;
      -ms-interpolation-mode: bicubic;
    }
    /* Container styles */
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #004d40 0%, #00796b 100%);
      padding: 40px 30px;
      text-align: center;
    }
    .content {
      padding: 40px 30px;
      color: #333333;
    }
    .footer {
      background-color: #f8f9fa;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e9ecef;
    }
    /* Typography */
    h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 15px;
    }
    .subtitle {
      color: #ffffff;
      font-size: 18px;
      opacity: 0.9;
      margin: 0;
    }
    p {
      margin: 0 0 20px;
    }
    /* Button styles */
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #00796b 0%, #009688 100%);
      color: #ffffff;
      text-decoration: none;
      padding: 14px 28px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      margin: 30px 0;
      transition: transform 0.2s ease;
    }
    .button:hover {
      transform: translateY(-2px);
    }
    /* Comment box */
    .comment-box {
      background-color: #f8f9fa;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
      border: 1px solid #e9ecef;
    }
    .comment-text {
      font-size: 18px;
      color: #004d40;
      font-weight: 500;
      margin: 0;
    }
    /* Stats */
    .stats {
      display: inline-block;
      background-color: #e8f5e9;
      color: #2e7d32;
      padding: 8px 16px;
      border-radius: 20px;
      font-weight: 600;
      margin: 10px 0;
    }
    /* Responsive styles */
    @media screen and (max-width: 600px) {
      .email-container {
        width: 100% !important;
        border-radius: 0;
      }
      .content {
        padding: 30px 20px !important;
      }
      .button {
        width: 100% !important;
        text-align: center !important;
      }
    }
    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      body {
        background-color: #1a1a1a;
        color: #ffffff;
      }
      .email-container {
        background-color: #2d2d2d;
      }
      .content {
        color: #ffffff;
      }
      .comment-box {
        background-color: #3d3d3d;
        border-color: #4d4d4d;
      }
      .comment-text {
        color: #81c784;
      }
      .footer {
        background-color: #2d2d2d;
        border-color: #4d4d4d;
      }
      .stats {
        background-color: #1b5e20;
        color: #81c784;
      }
    }
  </style>
</head>
<body>
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" class="email-container" width="600" border="0" cellspacing="0" cellpadding="0">
          <!-- Header -->
          <tr>
            <td class="header">
              <img src="cid:logo" alt="At-Taleem Logo" width="120" height="auto" style="max-width: 120px; margin-bottom: 20px;">
              <h1>অভিনন্দন!</h1>
              <p class="subtitle">আপনার ${commentType} ${milestone} জন মানুষ পছন্দ করেছেন</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td class="content">
              <p>আসসালামু আলাইকুম,</p>
              <p>প্রিয় তালিমের সদস্য মহোদয়/মহোদয়া,</p>
              
              <div class="comment-box">
                <p class="comment-text">"${comment.content}"</p>
              </div>
              
              <div style="text-align: center;">
                <span class="stats">${milestone} জন পছন্দ করেছেন</span>
              </div>
              
              <div style="text-align: center;">
                <a href="${entityUrl}" class="button">বিস্তারিত দেখুন</a>
              </div>
              
              <p>আপনার মূল্যবান মতামত আমাদের কমিউনিটিকে সমৃদ্ধ করছে।</p>
              <p>আল্লাহ হাফেজ</p>
              <p style="margin-top: 30px;">At-Taleem Team</p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td class="footer">
              <p style="margin: 0 0 10px; color: #666666;">© ${new Date().getFullYear()} At-Taleem</p>
              <p style="margin: 0;">
                <a href="${
                  process.env.URL
                }" style="color: #004d40; text-decoration: none;">আমাদের ওয়েবসাইট দেখুন</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

export async function PUT(request) {
  await connect();
  try {
    const { commentId, userId } = await request.json();

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return new Response(JSON.stringify({ error: "Comment not found" }), {
        status: 404,
      });
    }

    // Toggle like status
    const hasLiked = comment.likes.includes(userId);
    if (hasLiked) {
      comment.likes = comment.likes.filter((id) => id !== userId);
    } else {
      comment.likes.push(userId);
    }

    await comment.save();
    const likesCount = comment.likes.length;

    // Send milestone email notification
    if (!hasLiked && likesCount > 0 && likesCount % 10 === 0) {
      try {
        const user = await clerkClient.users.getUser(comment.userId);
        const userEmail = user.emailAddresses[0]?.emailAddress;

        if (userEmail) {
          const emailHtml = generateEmailHtml(comment, likesCount);
          const milestone = Math.floor(likesCount / 10) * 10;

          await fetch(`${process.env.URL}/api/emails`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Email-Type": "Like-milestone",
            },
            body: JSON.stringify({
              to: userEmail,
              subject: `অভিনন্দন: আপনার ${
                comment.parentComment ? "রিপ্লাইটি" : "কমেন্টটি"
              } ${milestone} জন পছন্দ করেছেন!`,
              html: emailHtml,
              metadata: {
                commentId: comment._id,
                entityId: comment.entityId,
                commentType: comment.commentType,
                milestone,
                likesCount,
              },
            }),
          });
        }
      } catch (emailError) {
        console.error("Error sending milestone email:", emailError);
        // Log error but don't fail the request
      }
    }

    return new Response(
      JSON.stringify({
        updatedComment: comment,
        likes: comment.likes.length,
        hasLiked: !hasLiked,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in PUT /api/comments:", error);
    return new Response(
      JSON.stringify({
        error: "Error processing like action",
        details: error.message,
      }),
      { status: 500 }
    );
  }
}
