// src/app/api/activities/route.js
import { connect } from "@/lib/mongodb/mongoose";
import Event from "@/lib/models/Event";
import { clerkClient, currentUser } from "@clerk/nextjs/server";

export async function GET(req) {
  await connect();
  const { searchParams } = new URL(req.url);
  const scope = searchParams.get("scope");
  const date = searchParams.get("date");
  const filter = {};
  if (scope) filter.scope = scope;
  if (date) {
    const d = new Date(date),
      n = new Date(d);
    n.setDate(d.getDate() + 1);
    filter.startDate = { $gte: d, $lt: n };
  }
  const activities = await Event.find(filter).sort({ startDate: 1 });
  return new Response(JSON.stringify({ activities }), {
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(req) {
  await connect();
  const user = await currentUser();
  const body = await req.json();

  // If body contains prefs → update user prefs
  if (body.ActivityPrefs) {
    if (!user) return new Response("Unauthorized", { status: 401 });
    await clerkClient.users.updateUser(user.id, {
      publicMetadata: {
        ...user.publicMetadata,
        ActivityPrefs: body.ActivityPrefs,
      },
    });
    return new Response(null, { status: 204 });
  }

  // Else → create new Activity (admin only)

  const {
    title,
    description,
    category,
    scope,
    createdBy,
    startDate,
    endDate,
    scheduledTime,
  } = body;

  if (!title || !scope || !startDate) {
    return new Response(JSON.stringify({ error: "Missing fields" }), {
      status: 400,
    });
  }

  // build notificationWants from user collection

  const act = await Event.create({
    title,
    description,
    category,
    scope,
    createdBy,
    startDate,
    endDate,
    scheduledTime,
  });

  // send notifications (email + in-app) here…

  return new Response(JSON.stringify({ Event: act }), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
}
