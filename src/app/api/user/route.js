// src/app/api/user/route.js
import { clerkClient } from "@clerk/nextjs/server";
import { connect } from "@/lib/mongodb/mongoose";

export async function GET(req) {
  // Connect to MongoDB if needed
  await connect();

  // Parse query parameters
  const url = new URL(req.url);
  const startIndex = parseInt(url.searchParams.get("startIndex") || "0", 10);
  const limit = Math.min(
    parseInt(url.searchParams.get("limit") || "100", 10),
    200
  );
  const sort = url.searchParams.get("sort") === "asc" ? "asc" : "desc";

  try {
    // Fetch users from Clerk with pagination and sort
    const users = await clerkClient.users.getUserList({
      limit,
      offset: startIndex,
      order: [["created_at", sort]],
    });
    // Calculate last month cutoff
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    // Filter in-memory for signup date
    const lastMonthUsers = users.data.filter(
      (u) => new Date(u.createdAt) >= oneMonthAgo
    ).length;

    // Total users in this page
    const totalUsers = users.data.length;

    // Return JSON response
    return new Response(JSON.stringify({ users, totalUsers, lastMonthUsers }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error fetching Clerk users:", err);
    return new Response(JSON.stringify({ error: "Failed to load users" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
