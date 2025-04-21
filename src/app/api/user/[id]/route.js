// src/app/api/user/[id]/route.js
import { connect } from "@/lib/mongodb/mongoose";
import { clerkClient } from "@clerk/nextjs/server";

// Handler for PATCH /api/user/:id
export async function PATCH(request, { params }) {
  await connect();
  const id = params.id;
  let payload;
  try {
    payload = await request.json();
  } catch (error) {
    return new Response(JSON.stringify({ error: "Invalid JSON payload" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { publicMetadata } = payload;
  if (!publicMetadata || typeof publicMetadata !== "object") {
    return new Response(
      JSON.stringify({ error: "Missing or invalid publicMetadata" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    // Call your action to update Clerk user metadata
    const updatedUser = await clerkClient.users.updateUserMetadata(id, {
      publicMetadata,
    });
    return new Response(JSON.stringify({ user: updatedUser }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error updating user metadata:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
