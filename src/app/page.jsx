import Homepage from "./Components/Homepage";
import RecentPosts from "./Components/RecentPosts";

export default async function Home() {
  return (
    <div className="flex w-full flex-col justify-center items-center">
      <Homepage />

      <div className="w-full max-w-6xl space-y-12">
        <RecentPosts />
      </div>
    </div>
  );
}
