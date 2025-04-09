// src/app/api/firebase-token/route.js
import { getAuth } from "@clerk/nextjs/server";
import admin from "@/firebaseAdmin";

export async function GET(req) {
  // Verify Clerk session
  const { userId } = getAuth(req);
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Optionally: check sessionClaims.publicMetadata.isAdmin if you want only admins
  // if (!sessionClaims?.publicMetadata?.isAdmin) {
  //   return new Response("Forbidden", { status: 403 });
  // }

  try {
    // Create a Firebase Custom Token for this userId
    const firebaseToken = await admin.auth().createCustomToken(userId);
    return new Response(JSON.stringify({ token: firebaseToken }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Failed to mint Firebase token:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
