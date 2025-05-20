import { connect } from "@/lib/mongodb/mongoose";
import Event from "@/lib/models/Event";

export async function GET(req) {
  if (
    req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new Response(null, { status: 401 });
  }
  await connect();
  const yesterdayEnd = new Date();
  yesterdayEnd.setHours(0, 0, 0, 0);
  yesterdayEnd.setDate(yesterdayEnd.getDate()); // midnight today
  // mark all past events as completed
  await Event.updateMany(
    {
      startDate: { $lt: yesterdayEnd },
      completed: false,
    },
    { $set: { completed: true } }
  );
  return new Response(null, { status: 204 });
}
