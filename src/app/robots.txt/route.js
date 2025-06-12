import { NextResponse } from "next/server";

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL;

  const robotsTxt = `# Allow all crawlers
User-agent: *
Allow: /

# Disallow admin and private routes
Disallow: /admin/
Disallow: /dashboard/
Disallow: /api/
Disallow: /sign-in
Disallow: /sign-up

# Sitemap
Sitemap: ${baseUrl}/api/sitemap`;

  return new NextResponse(robotsTxt, {
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
