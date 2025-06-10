export const dynamic = "force-dynamic";
export const runtime = "edge";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const error = formData.get("error");

    // Redirect to error page with details
    return Response.redirect(
      `${process.env.URL}/order-failed?error=${encodeURIComponent(
        error || "Payment failed"
      )}`
    );
  } catch (error) {
    console.error("SSL Fail Error:", error);
    return Response.redirect(
      `${process.env.URL}/order-failed?error=${encodeURIComponent(
        "Payment processing failed"
      )}`
    );
  }
}
