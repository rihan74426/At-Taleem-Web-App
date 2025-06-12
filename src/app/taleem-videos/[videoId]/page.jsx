import VideoDetail from "@/app/Components/VideoDetail";
import { generateVideoJsonLd } from "@/app/utils/jsonLd";
import Script from "next/script";

export async function generateStaticParams() {
  // Fetch all video IDs for static generation
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/videos?limit=1000`
  );
  const data = await res.json();

  return data.videos.map((video) => ({
    videoId: video._id,
  }));
}

export async function generateMetadata({ params }) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/videos/${params.videoId}`
  );
  const video = await res.json();

  return {
    title: `${video.title} - At-Taleem}`,
    description: video.description,
    alternates: {
      canonical: `/taleem-videos/${params.videoId}`,
    },
    openGraph: {
      title: `${video.title} - At-Taleem}`,
      description: video.description,
      url: `/taleem-videos/${params.videoId}`,
      images: [
        {
          url: video.thumbnailUrl,
          width: 1200,
          height: 630,
          alt: video.title,
        },
      ],
    },
  };
}

export default async function TaleemVideoDetailPage({ params }) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/videos/${params.videoId}`
  );
  const video = await res.json();

  const jsonLd = generateVideoJsonLd(video);

  return (
    <>
      <Script
        id="video-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <VideoDetail video={video} />
    </>
  );
}
