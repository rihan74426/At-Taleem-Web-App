export const dynamic = "force-dynamic";
export const runtime = "edge";

export async function POST() {
  try {
    // Redirect to published books page
    return Response.redirect(`${process.env.URL}/published-books`);
  } catch (error) {
    console.error("SSL Cancel Error:", error);
    return Response.redirect(`${process.env.URL}/published-books`);
  }
}
