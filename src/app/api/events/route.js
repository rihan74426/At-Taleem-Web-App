// src/app/api/activities/route.js
import { connect } from "@/lib/mongodb/mongoose";
import Event from "@/lib/models/Event";
import { currentUser, users } from "@clerk/nextjs/server";
import User from "@/lib/models/user.model";

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
    await users.updateUser(user.id, {
      publicMetadata: {
        ...user.publicMetadata,
        ActivityPrefs: body.ActivityPrefs,
      },
    });
    return new Response(null, { status: 204 });
  }

  // Else → create new Activity (admin only)
  if (!user?.publicMetadata?.isAdmin) {
    return new Response("Unauthorized", { status: 401 });
  }
  const {
    title,
    description,
    category,
    scope,
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
  const prefField = `publicMetadata.activityPrefs.${scope}`;
  const allUsers = await User.find({ [prefField]: true }, { _id: 1 }).lean();
  const notifyList = allUsers.map((u) => u._id.toString());

  const act = await Event.create({
    title,
    description,
    category,
    scope,
    startDate,
    endDate,
    scheduledTime,
    notificationWants: notifyList,
  });

  // send notifications (email + in-app) here…

  return new Response(JSON.stringify({ Event: act }), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
}
