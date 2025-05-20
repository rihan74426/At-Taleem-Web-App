import { connect } from "@/lib/mongodb/mongoose";
import Event from "@/lib/models/Event";
import { clerkClient } from "@clerk/nextjs/dist/types/server";

// Utility to get all matching weekdays between two dates
function getMatchingDates(startDate, endDate, weekdays) {
  const matchingDates = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    if (weekdays.includes(current.getDay())) {
      matchingDates.push(new Date(current)); // push a copy
    }
    current.setDate(current.getDate() + 1);
  }

  return matchingDates;
}

export async function GET() {
  await connect();

  const today = new Date();
  const nextMonth = new Date(today);
  nextMonth.setMonth(today.getMonth() + 1);

  // Get all Saturday, Tuesday, Thursday
  const mainEventDays = getMatchingDates(today, nextMonth, [2, 4, 6]); // Tue, Thu, Sat
  const womenEventDays = getMatchingDates(today, nextMonth, [0]); // Sunday only

  const createdEvents = [];
  const scope = "weekly";

  const usersWithMatchingPrefs = await clerkClient.users.getUserList({
    query: `publicMetadata.eventPrefs.${scope}:true`,
  });
  const notifyList =
    usersWithMatchingPrefs.length > 0
      ? usersWithMatchingPrefs.map((u) => u.id)
      : [];

  for (const date of mainEventDays) {
    const existing = await Event.findOne({ startDate: date, scope });

    if (!existing) {
      const event = await Event.create({
        title: "তালিমের মাহফিল",
        description: ` তারিখঃ (${date.toLocaleDateString()})
        আল্লামা মুহাম্মদ নিজাম উদ্দীন রশিদী 
খতিব-বহদ্দারহাট জামে মসজিদ 
মুহাদ্দিস -ছোবাহানিয়া আলিয়া কামিল মাদ্রাসা 
প্রতিষ্ঠাতা :আত-তালিমুন নববী আলিম মাদ্রাসা`,
        startDate: date,
        scope: "weekly",
        location: "বহদ্দারহাট জামে মসজিদ, বহদ্দারহাট, চট্টগ্রাম", // your default location
        createdBy: "System Generated", // or some default user/system id
        scheduledTime: "2025-05-20T13:00:00.729+00:00",
        notifyList: notifyList,
      });
      createdEvents.push(event);
    }
  }

  for (const date of womenEventDays) {
    const existing = await Event.findOne({
      startDate: date,
      title: "মহিলা তালিম",
    });
    if (!existing) {
      const event = await Event.create({
        title: "মহিলা তালিম",
        description: `তারিখঃ (${date.toLocaleDateString()})
আল্লামা মুহাম্মদ নিজাম উদ্দীন রশিদী 
খতিব-বহদ্দারহাট জামে মসজিদ 
মুহাদ্দিস -ছোবাহানিয়া আলিয়া কামিল মাদ্রাসা 
প্রতিষ্ঠাতা :আত-তালিমুন নববী আলিম মাদ্রাসা`,
        startDate: date,
        scope: "weekly",
        location:
          "আত্-তালীমুন নববী আলিম মাদ্রাসা, শুলকবহর, বহদ্দারহাট, চট্টগ্রাম",
        createdBy: "System Generated",
      });
      createdEvents.push(event);
    }
  }

  return new Response(
    JSON.stringify({ message: "Events created", count: createdEvents.length }),
    { status: 200 }
  );
}
