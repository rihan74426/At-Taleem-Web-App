"use client";
import VideoListing from "../Components/VideoListing";

export const metadata = {
  title:
    "Juma Khutbah Videos - At-Taleem || প্রাঞ্জল ও তথ্যবহুল জুমার খুৎবার ভিডিও",
  description:
    "Watch and listen to Juma Khutbah videos. Access weekly Friday sermons and Islamic lectures from renowned scholars.",
  alternates: {
    canonical: "/juma-videos",
  },
  openGraph: {
    title:
      "Juma Khutbah Videos - At-Taleem || প্রাঞ্জল ও তথ্যবহুল জুমার খুৎবার ভিডিও",
    description:
      "Watch and listen to Juma Khutbah videos. Access weekly Friday sermons and Islamic lectures from renowned scholars.",
    url: "/juma-videos",
  },
  twitter: {
    title:
      "Juma Khutbah Videos - At-Taleem || প্রাঞ্জল ও তথ্যবহুল জুমার খুৎবার ভিডিও",
    description:
      "Watch and listen to Juma Khutbah videos. Access weekly Friday sermons and Islamic lectures from renowned scholars.",
  },
};

export default function JumaVideosPage() {
  return <VideoListing category="Juma" title="Juma Khutbah Videos" />;
}
