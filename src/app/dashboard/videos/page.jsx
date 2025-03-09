"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminVideosPage() {
  const [title, setTitle] = useState("");
  const [platform, setPlatform] = useState("YouTube"); // or "facebook"
  const [category, setCategory] = useState("Taleem"); // or "facebook"
  const [videoUrl, setVideoUrl] = useState("");
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch("/api/videos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, platform, videoUrl, category }),
    });
    if (res.ok) {
      router.push("/taleem-videos"); // Redirect to video list
    } else {
      console.error("Error adding video");
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Add New Video</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="Video Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border p-2 rounded"
          required
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="Taleem">Taleem</option>
          <option value="Juma">Juma</option>
        </select>
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="YouTube">YouTube</option>
          <option value="Facebook">Facebook</option>
        </select>
        <input
          type="url"
          placeholder="Video URL (share or embed link)"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          className="border p-2 rounded"
          required
        />
        <button type="submit" className="bg-blue-500 text-white py-2 rounded">
          Add Video
        </button>
      </form>
    </div>
  );
}
