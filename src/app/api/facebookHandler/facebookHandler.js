import nodeFetch from "node-fetch";

export async function GET(request) {
  // Parse the URL query parameters.
  const { searchParams } = new URL(request.url);
  const shareUrl = searchParams.get("shareUrl");

  if (!shareUrl) {
    return new Response(JSON.stringify({ error: "Missing shareUrl" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Use nodeFetch to resolve the URL.
    const response = await nodeFetch(shareUrl, {
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
      },
    });
    // Return the resolved URL.
    return new Response(JSON.stringify({ finalUrl: response.url }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error resolving Facebook URL:", error);
    return new Response(
      JSON.stringify({ error: "Error resolving Facebook URL" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
