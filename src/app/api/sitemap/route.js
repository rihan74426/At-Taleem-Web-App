import { NextResponse } from "next/server";

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL;

  // Static routes
  const staticRoutes = [
    "",
    "/about-us",
    "/programme",
    "/institutions",
    "/published-books",
    "/taleem-videos",
    "/juma-videos",
    "/sign-in",
    "/sign-up",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: "weekly",
    priority: route === "" ? 1.0 : 0.8,
  }));

  // Fetch dynamic content (videos, books, etc.)
  const [videos, books] = await Promise.all([
    fetch(`${baseUrl}/api/videos?limit=1000`).then((res) => res.json()),
    fetch(`${baseUrl}/api/books?limit=1000`).then((res) => res.json()),
  ]);

  // Dynamic routes for videos
  const videoRoutes =
    videos.videos?.map((video) => ({
      url: `${baseUrl}/${video.category.toLowerCase()}-videos/${video._id}`,
      lastModified: new Date(video.updatedAt || video.createdAt).toISOString(),
      changeFrequency: "monthly",
      priority: 0.7,
    })) || [];

  // Dynamic routes for books
  const bookRoutes =
    books.books?.map((book) => ({
      url: `${baseUrl}/published-books/${book._id}`,
      lastModified: new Date(book.updatedAt || book.createdAt).toISOString(),
      changeFrequency: "monthly",
      priority: 0.7,
    })) || [];

  const allRoutes = [...staticRoutes, ...videoRoutes, ...bookRoutes];

  // Generate sitemap XML
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${allRoutes
        .map(
          (route) => `
        <url>
          <loc>${route.url}</loc>
          <lastmod>${route.lastModified}</lastmod>
          <changefreq>${route.changeFrequency}</changefreq>
          <priority>${route.priority}</priority>
        </url>
      `
        )
        .join("")}
    </urlset>`;

  return new NextResponse(sitemap, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
