"use client";
import VideoListing from "../Components/VideoListing";

export const metadata = {
  title: "Taleem Videos - Islamic Educational Content",
  description:
    "Access comprehensive Islamic educational videos and lectures. Learn Quran, Hadith, and Islamic studies through our curated collection of Taleem videos.",
  alternates: {
    canonical: "/taleem-videos",
  },
  openGraph: {
    title: "Taleem Videos - Islamic Educational Content",
    description:
      "Access comprehensive Islamic educational videos and lectures. Learn Quran, Hadith, and Islamic studies through our curated collection of Taleem videos.",
    url: "/taleem-videos",
  },
};

export default function TaleemVideosPage() {
  return <VideoListing category="Taleem" title="Taleem Videos" />;
}
