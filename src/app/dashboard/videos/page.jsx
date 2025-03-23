"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import ResponseModal from "@/app/Components/ResponseModal";
import "react-datepicker/dist/react-datepicker.css";
import { Datepicker } from "flowbite-react";

export default function AdminVideosPage({
  initialVideo = null,
  onClose,
  onUpdate,
}) {
  const [title, setTitle] = useState(initialVideo?.title || "");
  const [description, setDescription] = useState(
    initialVideo?.description || ""
  );
  const [platform, setPlatform] = useState(initialVideo?.platform || "YouTube");
  const [category, setCategory] = useState(initialVideo?.category || "Taleem");
  const [videoUrl, setVideoUrl] = useState(initialVideo?.videoUrl || "");
  const [recordingDate, setRecordingDate] = useState(
    initialVideo?.recordingDate
      ? new Date(initialVideo.recordingDate)
      : new Date()
  );
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
    const payload = {
      title,
      description,
      platform,
      videoUrl,
      category,
      recordingDate,
    };

    // Determine if we're adding a new video or editing an existing one
    const method = initialVideo ? "PATCH" : "POST";
    const url = initialVideo
      ? `/api/videos/${initialVideo._id}`
      : "/api/videos";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      showModal("Successfully saved video!", "success");
      onUpdate(payload);
      onClose();
    } else {
      showModal("Failed to save video! Please try again...", "error");
      console.error("Error saving video");
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">
        {initialVideo ? "Edit Video" : "Add New Video"}
      </h1>
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
              : "Please put the collected video embed link from desktop Facebook"
          }
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          className="border p-2 rounded dark:bg-black"
          required
        />
        <div className="flex items-center gap-2">
          <Datepicker
            onChange={(date) => setRecordingDate(date)}
            value={recordingDate}
            showTodayButton
          />
          <label>: Recording Date</label>
        </div>
        <button type="submit" className="bg-blue-500 text-white py-2 rounded">
          {initialVideo ? "Update Video" : "Add Video"}
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
