// src/app/api/firebase-token/route.js
import admin from "@/firebaseAdmin";

export async function GET() {
  // create a custom token for this Clerk user id
  try {
    const firebaseToken = await admin.auth().createCustomToken(user.id);
    return new Response(JSON.stringify({ token: firebaseToken }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Failed to mint Firebase token:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
