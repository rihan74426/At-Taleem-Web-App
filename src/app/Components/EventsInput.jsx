// src/app/events/EventInputPage.jsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { useUser } from "@clerk/nextjs";
import { useSearchParams, useRouter } from "next/navigation";
import ResponseModal from "@/app/Components/ResponseModal";

const SCOPES = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

export default function EventInputPage() {
  const { user, isLoaded } = useUser();
  const isAdmin = user?.publicMetadata?.isAdmin;
  const router = useRouter();
  const searchParams = useSearchParams();
  const formRef = useRef();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: "",
      description: "",
      scope: "weekly",
      startDate: "",
      scheduledTime: "",
      seriesIndex: 1,
      location: "",
      featured: false,
    },
  });

  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState(null);
  const [modal, setModal] = useState({
    isOpen: false,
    message: "",
    status: "",
  });

  const showModal = (msg, status) =>
    setModal({ isOpen: true, message: msg, status });

  const id = searchParams.get("id");

  /** 1. Fetch existing event if editing */
  const fetchEvent = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/events/${id}`);
      if (!res.ok) throw new Error("Failed to fetch event");

      const { event } = await res.json();
      if (event) {
        setEvent(event);
        // Format dates for form inputs
        const startDateFormatted = event.startDate
          ? new Date(event.startDate).toISOString().split("T")[0]
          : "";

        const scheduledTimeFormatted = event.scheduledTime
          ? new Date(event.scheduledTime).toISOString().slice(0, 16)
          : "";

        // Prefill form
        reset({
          title: event.title,
          description: event.description || "",
          scope: event.scope,
          startDate: startDateFormatted,
          scheduledTime: scheduledTimeFormatted,
          seriesIndex: event.seriesIndex || 1,
          location: event.location || "",
          featured: event.featured || false,
        });
      }
    } catch (err) {
      console.error(err);
      showModal("Failed to load event", "error");
    } finally {
      setLoading(false);
      formRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [id, reset]);

  useEffect(() => {
    if (isLoaded) fetchEvent();
  }, [isLoaded, fetchEvent]);

  /** 2. Submit create/update */
  const onSubmit = async (data) => {
    if (!isLoaded) return;

    if (!isAdmin) {
      showModal("Only admins can save events", "error");
      return;
    }

    try {
      const payload = {
        ...data,
        createdBy: user.id,
        startDate: data.startDate,
        scheduledTime: data.scheduledTime || null,
        seriesIndex: Number(data.seriesIndex),
        featured: Boolean(data.featured),
      };

      const method = id ? "PUT" : "POST";
      const url = id ? `/api/events/${id}` : "/api/events";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to save event");
      }

      showModal(`Event ${id ? "updated" : "created"} successfully!`, "success");

      if (!id) {
        // Clear form for a new event
        reset();
      }
    } catch (err) {
      console.error(err);
      showModal(err.message || "Failed to save event", "error");
    }
  };

  // Get interested and notification counts
  const interestedCount = event?.interestedUsers?.length || 0;
  const notifyCount = event?.notificationWants?.length || 0;

  if (!isLoaded || loading) {
    return <p className="p-8 text-center">Loading…</p>;
  }

  return (
    <div
      ref={formRef}
      className="max-w-2xl mx-auto p-6 m-5 bg-white dark:bg-gray-800 rounded shadow space-y-6"
    >
      <h2 className="text-2xl font-bold text-center">
        {id ? "Edit Event" : "New Event"}
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Title */}
        <div>
          <label className="block font-semibold">Title*</label>
          <input
            {...register("title", { required: "Title is required" })}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
          />
          {errors.title && (
            <p className="text-red-500 text-sm">{errors.title.message}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block font-semibold">Description</label>
          <textarea
            {...register("description")}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
            rows={4}
          />
        </div>

        {/* Scope */}
        <div>
          <label className="block font-semibold">Scope*</label>
          <select
            {...register("scope", { required: "Scope is required" })}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
          >
            {SCOPES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          {errors.scope && (
            <p className="text-red-500 text-sm">{errors.scope.message}</p>
          )}
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold">Start Date*</label>
            <input
              type="date"
              {...register("startDate", { required: "Start date is required" })}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
            />
            {errors.startDate && (
              <p className="text-red-500 text-sm">{errors.startDate.message}</p>
            )}
          </div>
          <div>
            <label className="block font-semibold">Scheduled Time</label>
            <input
              type="datetime-local"
              {...register("scheduledTime")}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block font-semibold">Location</label>
          <input
            {...register("location")}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
            placeholder="Optional location"
          />
        </div>

        {/* Series Index */}
        <div>
          <label className="block font-semibold">Series Index</label>
          <input
            type="number"
            min="1"
            {...register("seriesIndex", {
              valueAsNumber: true,
              min: { value: 1, message: "Series index must be at least 1" },
            })}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
          />
          {errors.seriesIndex && (
            <p className="text-red-500 text-sm">{errors.seriesIndex.message}</p>
          )}
        </div>

        {/* Featured */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="featured"
            {...register("featured")}
            className="h-5 w-5 text-blue-600"
          />
          <label htmlFor="featured" className="font-semibold">
            Featured Event
          </label>
        </div>

        <button
          type="submit"
          disabled={!isAdmin}
          className={`w-full py-2 rounded text-white ${
            isAdmin
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          {id ? "Update Event" : "Create Event"}
        </button>

        {!isAdmin && (
          <p className="text-amber-500 text-sm text-center">
            Only administrators can create or edit events.
          </p>
        )}
      </form>

      {/* Event stats (if editing) */}
      {event && (
        <div className="flex justify-between items-center pt-4 border-t">
          <div>
            <strong>Interested:</strong> {interestedCount}
          </div>
          <div>
            <strong>To Notify:</strong> {notifyCount}
          </div>
          {event.completed && (
            <div className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-1 rounded">
              Completed
            </div>
          )}
          {event.canceled && (
            <div className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 px-2 py-1 rounded">
              Canceled
            </div>
          )}
        </div>
      )}

      <ResponseModal
        isOpen={modal.isOpen}
        message={modal.message}
        status={modal.status}
        onClose={() => setModal((m) => ({ ...m, isOpen: false }))}
      />
    </div>
  );
}
