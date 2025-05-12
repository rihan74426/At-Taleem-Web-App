// src/app/api/institutions/[id]/subscribe/route.js

import { connect } from "@/lib/mongodb/mongoose";
import Institution from "@/lib/models/Institution";

export async function POST(req, { params }) {
  await connect();
  const institutionId = await params.id;
  const { email } = await req.json();

  if (!email || !institutionId) {
    return new Response(JSON.stringify({ error: "Missing email or id" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Add to array if not already present
  const updated = await Institution.findByIdAndUpdate(
    institutionId,
    { $addToSet: { interestedEmails: email.toLowerCase() } },
    { new: true }
  );

  if (!updated) {
    return new Response(JSON.stringify({ error: "Institution not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
