// src/app/activities/EventInputPage.jsx
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
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: "",
      description: "",
      scope: "weekly",
      startDate: "",
      scheduledTime: "",
      seriesIndex: 1,
    },
  });

  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState(null);
  const [modal, setModal] = useState({
    isOpen: false,
    message: "",
    status: "",
  });
  const showModal = (msg, status) =>
    setModal({ isOpen: true, message: msg, status });

  const id = searchParams.get("id");

  /** 1. Fetch existing activity if editing */
  const fetchActivity = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`/api/events?scope&date&id=${id}`);
      if (!res.ok) throw new Error();
      const { activities } = await res.json();
      const act = activities[0];
      if (act) {
        setActivity(act);
        // prefill
        reset({
          title: act.title,
          description: act.description || "",
          scope: act.scope,
          startDate: act.startDate.split("T")[0],
          scheduledTime: act.scheduledTime?.slice(0, 16) || "",
          seriesIndex: act.seriesIndex,
        });
      }
    } catch (err) {
      console.error(err);
      showModal("Failed to load activity", "error");
    } finally {
      setLoading(false);
      formRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [id, reset]);

  useEffect(() => {
    if (isLoaded) fetchActivity();
  }, [isLoaded, fetchActivity]);

  /** 2. Submit create/update */
  const onSubmit = async (data) => {
    if (!isAdmin) {
      showModal("Only admins can save activities", "error");
      return;
    }
    try {
      const payload = {
        ...data,
        startDate: data.startDate,
        scheduledTime: data.scheduledTime || null,
        seriesIndex: Number(data.seriesIndex),
      };
      const method = id ? "PUT" : "POST";
      const res = await fetch(`/api/events${id ? `/${id}` : ""}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      showModal(`Activity ${id ? "updated" : "created"}!`, "success");
      if (!id) reset();
    } catch (err) {
      console.error(err);
      showModal("Save failed", "error");
    }
  };

  // RSVP and Notify counts live-display
  const interestedCount = activity?.interestedPersons?.length || 0;
  const notifyCount = activity?.notificationWants?.length || 0;

  if (!isLoaded || loading) {
    return <p className="p-8 text-center">Loading…</p>;
  }

  return (
    <div
      ref={formRef}
      className="max-w-2xl mx-auto p-6 m-5 bg-white dark:bg-gray-800 rounded shadow space-y-6"
    >
      <h2 className="text-2xl font-bold text-center">
        {id ? "Edit Activity" : "New Activity"}
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Title */}
        <div>
          <label className="block font-semibold">Title*</label>
          <input
            {...register("title", { required: true })}
            className="w-full p-2 border rounded dark:bg-black"
          />
          {errors.title && <p className="text-red-500 text-sm">Required</p>}
        </div>

        {/* Description */}
        <div>
          <label className="block font-semibold">Description</label>
          <textarea
            {...register("description")}
            className="w-full p-2 border rounded dark:bg-black"
            rows={3}
          />
        </div>

        {/* Scope */}
        <div>
          <label className="block font-semibold">Scope*</label>
          <select
            {...register("scope", { required: true })}
            className="w-full p-2 border rounded dark:bg-black"
          >
            {SCOPES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold">Start Date*</label>
            <input
              type="date"
              {...register("startDate", { required: true })}
              className="w-full p-2 border rounded dark:bg-black"
            />
            {errors.startDate && (
              <p className="text-red-500 text-sm">Required</p>
            )}
          </div>
          <div>
            <label className="block font-semibold">Scheduled Time</label>
            <input
              type="datetime-local"
              {...register("scheduledTime")}
              className="w-full p-2 border rounded dark:bg-black"
            />
          </div>
        </div>

        {/* Series Index */}
        <div>
          <label className="block font-semibold">Series Index</label>
          <input
            type="number"
            {...register("seriesIndex", { valueAsNumber: true })}
            className="w-full p-2 border rounded dark:bg-black"
          />
        </div>

        <button
          type="submit"
          className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
        >
          {id ? "Update Activity" : "Create Activity"}
        </button>
      </form>

      {/* Live RSVP / Notify preview */}
      {activity && (
        <div className="flex justify-between items-center pt-4 border-t">
          <div>
            <strong>Interested:</strong> {interestedCount}
          </div>
          <div>
            <strong>To&nbsp;Notify:</strong> {notifyCount}
          </div>
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
