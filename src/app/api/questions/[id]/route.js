import Question from "@/lib/models/Question";
import { connect } from "@/lib/mongodb/mongoose";
import { clerkClient } from "@clerk/nextjs/server";
import fetch from "node-fetch";
// import sendEmail from "@/lib/utils/sendEmail"; // Ensure your sendEmail utility is correctly exported

// Helper function to generate email HTML
const generateEmailHtml = (question, voteCount) => {
  const milestone = Math.floor(voteCount / 10) * 10;
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
  <title>আপনার প্রশ্নটি দ্বারা ${milestone} জন উপকৃত হয়েছে</title>
  <style>
    /* Reset styles */
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
      line-height: 1.4;
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
    /* Responsive styles */
    @media screen and (max-width: 600px) {
      .email-container {
        width: 100% !important;
      }
      .email-content {
        padding: 20px !important;
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
        background-color: #2d2d2d !important;
      }
      .email-content {
        color: #ffffff !important;
      }
      .button {
        background-color: #00796b !important;
        color: #ffffff !important;
      }
    }
  </style>
</head>
<body>
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table role="presentation" class="email-container" width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: #004d40; padding: 30px; text-align: center;">
              <img src="cid:logo" alt="At-Taleem Logo" width="120" height="auto" style="max-width: 120px; margin-bottom: 15px;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #ffffff;">সাদাকায়ে জারিয়ার সুসংবাদ</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td class="email-content" style="padding: 30px; color: #333333;">
              <p style="margin: 0 0 20px;">আসসালামু আলাইকুম,</p>
              <p style="margin: 0 0 20px;">কেমন আছেন?</p>
              <p style="margin: 0 0 20px;">প্রিয় তালিমের সদস্য মহোদয়/মহোদয়া,</p>
              <p style="margin: 0 0 20px;">আপনার <strong style="color: #004d40;">"${
                question.title
              }"</strong> প্রশ্নটি <strong>${milestone}</strong> জন মানুষের উপকার করেছে! এটি একটি বিরাট সাদাকায়ে জারিয়ার সওয়াব।</p>
              
              <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <p style="margin: 0 0 10px; font-weight: 600;">সাদাকায়ে জারিয়া কি?</p>
                <p style="margin: 0;">সাদাকায়ে জারিয়া হল এমন একটি দান যা মানুষের উপকারে আসে এবং এর সওয়াব মৃত্যুর পরেও অব্যাহত থাকে।</p>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.URL}/questionnaires/${
    question._id
  }" class="button" style="display: inline-block; background-color: #00796b; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 4px; font-weight: 600; font-size: 16px; margin: 0 10px;">বিস্তারিত দেখুন</a>
                <a href="${
                  process.env.URL
                }/questionnaires" class="button" style="display: inline-block; background-color: #00796b; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 4px; font-weight: 600; font-size: 16px; margin: 0 10px;">আরও প্রশ্ন করুন</a>
              </div>
              
              <p style="margin: 20px 0;">আল্লাহ হাফেজ</p>
              <p style="margin: 0;">At-Taleem Team</p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #eef2f7; padding: 20px; text-align: center; font-size: 12px; color: #666666;">
              <p style="margin: 0 0 10px;">© ${new Date().getFullYear()} At-Taleem</p>
              <p style="margin: 0;">
                <a href=${
                  process.env.URL
                } style="color: #004d40; text-decoration: none;">আমাদের ওয়েবসাইট দেখুন</a>
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

export async function PATCH(request, { params }) {
  await connect();
  try {
    const { id } = await params;
    const { userId, answer, category } = await request.json();

    if (!userId) {
      return new Response(JSON.stringify({ error: "Missing userId" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fetch the current question
    const question = await Question.findById(id);
    if (!question) {
      return new Response(JSON.stringify({ error: "Question not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const index = question.helpfulVotes.indexOf(userId);
    if (answer && category) {
      question.answer = answer;
      question.category = category;
      question.status = "answered";
      question.answeredAt = new Date();
      question.helpfulVotes = [];
    } else if (index === -1) {
      // Not voted yet, add the user's vote
      question.helpfulVotes.push(userId);
    } else {
      // User already voted, so remove their vote
      question.helpfulVotes.splice(index, 1);
    }

    const updatedQuestion = await question.save();

    // Check if the vote count has reached a new milestone (multiple of 10)
    const voteCount = updatedQuestion.helpfulVotes.length;
    if (voteCount > 0 && voteCount % 10 === 0) {
      const user = await clerkClient.users.getUser(updatedQuestion.userId);
      const userEmail = user.emailAddresses[0]?.emailAddress;

      if (userEmail) {
        const milestone = Math.floor(voteCount / 10) * 10;
        const emailHtml = generateEmailHtml(updatedQuestion, voteCount);

        try {
          await fetch(`${process.env.URL}/api/emails`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Email-Type": "vote-milestone",
            },
            body: JSON.stringify({
              to: userEmail,
              subject: `অভিনন্দন: আপনার প্রশ্নটি দ্বারা ${milestone} জন উপকৃত হয়েছে!`,
              html: emailHtml,
              metadata: {
                questionId: updatedQuestion._id,
                milestone,
                voteCount,
              },
            }),
          });
        } catch (emailError) {
          console.error("Error sending milestone email:", emailError);
          // Don't throw the error, just log it
        }
      }
    }

    return new Response(JSON.stringify(updatedQuestion), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error toggling helpful vote:", error);
    return new Response(
      JSON.stringify({ error: "Error toggling helpful vote" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

export async function DELETE(request, { params }) {
  await connect();
  try {
    const { id } = await params;
    const deletedQuestion = await Question.findByIdAndDelete(id);
    if (!deletedQuestion) {
      return new Response(JSON.stringify({ error: "Question not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error deleting question:", error);
    return new Response(JSON.stringify({ error: "Error deleting question" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
