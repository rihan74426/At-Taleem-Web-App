// import CallToAction from "@/app/Components/CallToAction";
import { Button } from "flowbite-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";

interface Post {
  title: string;
  category: string;
  image: string;
  content: string;
  createdAt: string;
  // add other post properties as needed
}

export default async function PostPage({
  params,
}: {
  params: { slug: string };
}) {
  // Force resolution of params
  const resolvedParams = await Promise.resolve(params);
  const { slug } = resolvedParams;
  const decodedSlug = decodeURIComponent(slug);
  let post: Post | null = null;

  try {
    const result = await fetch(`${process.env.URL as string}/api/post/get`, {
      method: "POST",
      body: JSON.stringify({ slug: decodedSlug }),
      cache: "no-store",
    });

    if (!result.ok) throw new Error("Failed to fetch post");

    const data = await result.json();
    post = data?.post || null;
  } catch (error) {
    console.error("Error fetching post:", error);
  }

  if (!post) {
    console.log(decodedSlug);
    return (
      <main className="p-3 flex flex-col max-w-6xl mx-auto min-h-screen">
        <h2 className="text-3xl mt-10 p-3 text-center font-serif max-w-2xl mx-auto lg:text-4xl">
          Post not found
        </h2>
      </main>
    );
  }

  return (
    <main className="p-3 flex flex-col max-w-6xl mx-auto min-h-screen">
      <h1 className="text-3xl mt-10 p-3 text-center font-serif max-w-2xl mx-auto lg:text-4xl">
        {post.title}
      </h1>
      <Link
        href={`/search?category=${post.category}`}
        className="self-center mt-5"
      >
        <Button color="gray" pill size="xs">
          {post.category}
        </Button>
      </Link>
      <Image
        src={post.image}
        alt={post.title}
        className="mt-10 p-3 max-h-[600px] w-full object-cover"
        width={800}
        height={600}
      />
      <div className="flex justify-between p-3 border-b border-slate-500 mx-auto w-full max-w-2xl text-xs">
        <span>{new Date(post.createdAt).toLocaleDateString()}</span>
        <span className="italic">
          {(post.content.length / 1000).toFixed(0)} mins read
        </span>
      </div>
      <div
        className="p-3 max-w-2xl mx-auto w-full post-content"
        dangerouslySetInnerHTML={{ __html: post.content }}
      ></div>
    </main>
  );
}
