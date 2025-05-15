import { connect } from "@/lib/mongodb/mongoose";
import Activity from "@/lib/models/Activity";
import { currentUser, users } from "@clerk/nextjs/server";
import User from "@/lib/models/user.model";

export async function GET(req) {
  await connect();
  const { searchParams } = new URL(req.url);
  const filter = {};

  if (searchParams.has("scope")) {
    filter.scope = searchParams.get("scope");
  }
  if (searchParams.has("date")) {
    const d = new Date(searchParams.get("date"));
    const nextDay = new Date(d);
    nextDay.setDate(d.getDate() + 1);
    filter.startDate = { $gte: d, $lt: nextDay };
  }

  const activities = await Activity.find(filter).sort({ startDate: 1 }).lean();
  return new Response(JSON.stringify({ activities }), {
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(req) {
  await connect();
  const user = await currentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const body = await req.json();

  // — Update user prefs
  if (body.activityPrefs) {
    await users.updateUser(user.id, {
      publicMetadata: {
        ...user.publicMetadata,
        activityPrefs: body.activityPrefs,
      },
    });
    return new Response(null, { status: 204 });
  }

  // — Create new activity (admin only)
  if (!user.publicMetadata?.isAdmin) {
    return new Response("Forbidden", { status: 403 });
  }

  const { title, description, scope, startDate, endDate, scheduledTime } = body;
  if (!title || !scope || !startDate) {
    return new Response(JSON.stringify({ error: "Missing fields" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // build notificationWants from user prefs
  const prefField = `publicMetadata.activityPrefs.${scope}`;
  const usersToNotify = await User.find({ [prefField]: true }, { _id: 1 });
  const notifyList = usersToNotify.map((u) => u._id.toString());

  const activity = await Activity.create({
    title,
    description,
    scope,
    startDate,
    endDate,
    scheduledTime,
    createdBy: user.id,
    notificationWants: notifyList,
  });

  // TODO: trigger email + in-app notifications here

  return new Response(JSON.stringify({ activity }), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
}

export async function PATCH(req) {
  await connect();
  const user = await currentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  const data = await req.json();
  const { activityId, action } = data;

  const act = await Activity.findById(activityId);
  if (!act) return new Response("Not Found", { status: 404 });

  // — mark interested
  if (action === "toggleInterest") {
    const idx = act.interestedUsers.indexOf(user.id);
    if (idx >= 0) act.interestedUsers.splice(idx, 1);
    else act.interestedUsers.push(user.id);
    await act.save();
    return new Response(JSON.stringify({ interested: idx < 0 }), {
      status: 200,
    });
  }

  // — admin only mutations
  if (!user.publicMetadata?.isAdmin) {
    return new Response("Forbidden", { status: 403 });
  }

  // — toggle complete
  if (action === "toggleComplete") {
    act.completed = !act.completed;
    await act.save();
    return new Response(JSON.stringify({ completed: act.completed }), {
      status: 200,
    });
  }

  // — toggle admissionWants?
  if (action === "toggleNotifyWish") {
    const idx = act.notificationWants.indexOf(user.id);
    if (idx >= 0) act.notificationWants.splice(idx, 1);
    else act.notificationWants.push(user.id);
    await act.save();
    return new Response(
      JSON.stringify({ notificationWants: act.notificationWants }),
      { status: 200 }
    );
  }

  return new Response("Bad Request", { status: 400 });
}

export async function DELETE(req) {
  await connect();
  const user = await currentUser();
  if (!user?.publicMetadata?.isAdmin) {
    return new Response("Forbidden", { status: 403 });
  }
  const { activityId } = await req.json();
  const deleted = await Activity.findByIdAndDelete(activityId);
  if (!deleted) {
    return new Response("Not Found", { status: 404 });
  }
  return new Response(null, { status: 204 });
}
