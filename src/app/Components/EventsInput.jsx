"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import ResponseModal from "@/app/Components/ResponseModal";
import EventForm from "./EventForm";

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

export default function EventInputPage() {
  const { user, isLoaded } = useUser();
  const isAdmin = user?.publicMetadata?.isAdmin;
  const searchParams = useSearchParams();
  const formRef = useRef();

  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState(null);
  const [initialData, setInitialData] = useState(null);
  const [modal, setModal] = useState({
    isOpen: false,
    message: "",
    status: "",
  });

  const showModal = (msg, status) =>
    setModal({ isOpen: true, message: msg, status });
  const id = searchParams.get("id");

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
        setInitialData(formatEventForForm(event));
      }
    } catch (err) {
      console.error(err);
      showModal("Failed to load event", "error");
    } finally {
      setLoading(false);
      formRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [id]);

  useEffect(() => {
    if (isLoaded) fetchEvent();
  }, [isLoaded, fetchEvent]);

  const onSubmit = async (data) => {
    if (!isLoaded || !isAdmin) {
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
    } catch (err) {
      console.error(err);
      showModal(err.message || "Failed to save event", "error");
    }
  };

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

      <EventForm
        initialData={initialData}
        onSubmit={onSubmit}
        isAdmin={isAdmin}
      />

      {event && (
        <div className="flex justify-between items-center pt-4 border-t">
          <div>
            <strong>Interested: </strong> {interestedCount}
          </div>
          <div>
            <strong>To Notify: </strong> {notifyCount}
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
