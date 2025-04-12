// src/app/api/activities/[id]/route.js
import { connect } from "@/lib/mongodb/mongoose";
import Event from "@/lib/models/Event";
import { currentUser } from "@clerk/nextjs/server";

export async function GET(req, { params }) {
  await connect();
  const act = await Event.findById(params.id);
  if (!act) return new Response("Not found", { status: 404 });
  return new Response(JSON.stringify({ Event: act }), {
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(req, { params }) {
  await connect();
  const user = await currentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const act = await Event.findById(params.id);
  if (!act) return new Response("Not found", { status: 404 });

  // Toggle interest
  const uid = user.id;
  const idx = act.interestedPersons.indexOf(uid);
  if (idx === -1) act.interestedPersons.push(uid);
  else act.interestedPersons.splice(idx, 1);

  await act.save();
  return new Response(
    JSON.stringify({ interestedPersons: act.interestedPersons }),
    {
      headers: { "Content-Type": "application/json" },
    }
  );
}

// To mark completed (admin or cron)
export async function PATCH(req, { params }) {
  await connect();
  const user = await currentUser();
  const act = await Event.findById(params.id);
  if (!act) return new Response("Not found", { status: 404 });

  // only admin or automated cron
  if (!user?.publicMetadata?.isAdmin) {
    return new Response("Unauthorized", { status: 401 });
  }
  act.completed = true;
  await act.save();
  return new Response(null, { status: 204 });
}
