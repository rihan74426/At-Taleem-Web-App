"use client";

import { useState } from "react";
import EventForm from "./EventForm";
import ResponseModal from "@/app/Components/ResponseModal";

const formatEventForForm = (event) => ({
  title: event.title,
  description: event.description || "",
  scope: event.scope,
  startDate: event.startDate
    ? new Date(event.startDate).toISOString().split("T")[0]
    : "",
  scheduledTime: event.scheduledTime
    ? new Date(event.scheduledTime).toISOString().slice(0, 16)
    : "",
  seriesIndex: event.seriesIndex || 1,
  location: event.location || "",
  featured: event.featured || false,
});

export default function EventInputModal({ event, onClose }) {
  const formattedData = formatEventForForm(event);
  const [modal, setModal] = useState({
    isOpen: false,
    message: "",
    status: "",
  });

  const onSubmit = async (data) => {
    try {
      const payload = {
        ...data,
        startDate: data.startDate,
        scheduledTime: data.scheduledTime || null,
        seriesIndex: Number(data.seriesIndex),
        featured: Boolean(data.featured),
      };

      const res = await fetch(`/api/events/${event._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update event");
      }

      setModal({
        isOpen: true,
        message: "Event updated successfully!",
        status: "success",
      });
      setTimeout(onClose, 2000);
    } catch (err) {
      console.error(err);
      setModal({
        isOpen: true,
        message: err.message || "Failed to update event",
        status: "error",
      });
    }
  };

  return (
    <div className="fixed inset-0 flex items-center mt-0 justify-center z-50">
      <div className="bg-black/80 absolute inset-0" onClick={onClose}></div>
      <div className="relative bg-slate-500 h-5/6 p-5 overflow-auto sm:w-2/3 w-full lg:w-1/3 dark:bg-gray-600 rounded-lg shadow-lg m-5">
        {" "}
        <button
          className="ml-auto absolute right-5 top-2 items-center rounded-lg bg-transparent p-1.5 text-sm text-gray-400 hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-gray-400 dark:hover:text-white"
          onClick={onClose}
          title="Close"
        >
          <svg
            stroke="currentColor"
            fill="none"
            strokeWidth="2"
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            ></path>
          </svg>
        </button>
        <h2 className="text-2xl font-bold mb-4">Edit Event</h2>
        <EventForm
          initialData={formattedData}
          onSubmit={onSubmit}
          isAdmin={true}
        />
        <button
          onClick={onClose}
          className="mt-4 px-4 py-2 bg-red-500 rounded hover:bg-gray-400"
        >
          Close
        </button>
        <ResponseModal
          isOpen={modal.isOpen}
          message={modal.message}
          status={modal.status}
          onClose={() => setModal((m) => ({ ...m, isOpen: false }))}
        />
      </div>
    </div>
  );
}
