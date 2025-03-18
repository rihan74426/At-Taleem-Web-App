"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import ResponseModal from "@/app/Components/ResponseModal";

export default function AdminVideosPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [platform, setPlatform] = useState("YouTube"); // or "facebook"
  const [category, setCategory] = useState("Taleem"); // or "facebook"
  const [videoUrl, setVideoUrl] = useState("");
  const router = useRouter();
  const [modal, setModal] = useState({
    isOpen: false,
    message: "",
    status: "",
  });

  const showModal = (message, status) => {
    setModal({ isOpen: true, message, status });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch("/api/videos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        platform,
        videoUrl,
        category,
      }),
    });
    if (res.ok) {
      showModal("Successfully Added Video!", "success");
      router.push(`/${category.toLowerCase()}-videos`); // Redirect to video list
    } else {
      showModal("Failed to Add Video! Please try again...", "error");
      console.error("Error adding video");
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Add New Video</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="শিরোনাম"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border p-2 rounded dark:bg-black"
          required
        />
        <textarea
          type="text"
          placeholder="বিবরণী (অপশনাল)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="border p-2 rounded dark:bg-black"
        ></textarea>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border p-2 rounded dark:bg-black"
        >
          <option value="Taleem">তালিম</option>
          <option value="Juma">জুমা</option>
        </select>
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          className="border p-2 rounded dark:bg-black"
        >
          <option value="YouTube">YouTube</option>
          <option value="Facebook">Facebook</option>
        </select>
        <input
          type="text"
          placeholder={
            platform === "YouTube"
              ? "Please place the YouTube video link here"
              : "Please put the collected the video embed link from desktop facebook"
          }
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          className="border p-2 rounded dark:bg-black"
          required
        />
        <button type="submit" className="bg-blue-500 text-white py-2 rounded">
          Add Video
        </button>
      </form>
      <ResponseModal
        isOpen={modal.isOpen}
        message={modal.message}
        status={modal.status}
        onClose={() => setModal({ ...modal, isOpen: false })}
      />
    </div>
  );
}
