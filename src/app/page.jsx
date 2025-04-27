import Link from "next/link";
import Homepage from "./Components/Homepage";
import RecentPosts from "./Components/RecentPosts";

export default async function Home() {
  let posts = null;
  try {
    const result = await fetch(process.env.URL + "/api/post/get", {
      method: "POST",
      body: JSON.stringify({ limit: 9, order: "desc" }),
      cache: "no-store",
    });
    const data = await result.json();
    posts = data.posts;
  } catch (error) {
    console.log("Error getting post:", error);
  }
  return (
    <div className="flex w-full flex-col justify-center items-center">
      <Homepage />

      <div className="w-full max-w-6xl space-y-12">
        <RecentPosts />
      </div>
    </div>
  );
}
