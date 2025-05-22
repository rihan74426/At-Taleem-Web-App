"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import EventDetailModal from "../Components/EventDetailModal";
import Link from "next/link";
import {
  FiBell,
  FiCalendar,
  FiList,
  FiChevronLeft,
  FiChevronRight,
  FiFilter,
  FiCheck,
  FiStar,
  FiMap,
  FiEdit,
  FiTrash2,
  FiAlertCircle,
  FiX,
  FiPlus,
} from "react-icons/fi";
import { Menu } from "@headlessui/react";
import ResponseModal from "@/app/Components/ResponseModal";
import EventInputModal from "../Components/EventInputModal";
import CalendarView from "../Components/CalendarViewComp";

const SCOPES = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

export default function ProgrammePage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const isAdmin = user?.publicMetadata?.isAdmin;

  // State for view controls
  const [view, setView] = useState(localStorage.getItem("EventView") || "list");
  const [scope, setScope] = useState("weekly");
  const [page, setPage] = useState(1);
  const [limit] = useState(20); // Items per page
  const [sortBy, setSortBy] = useState("startDate");
  const [sortOrder, setSortOrder] = useState("asc");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState({
    featured: false,
    completed: false,
    canceled: false,
  });
  const [viewingEvent, setViewingEvent] = useState(null);

  // State for notification preferences
  const [prefs, setPrefs] = useState({
    weekly: false,
    monthly: false,
    yearly: false,
  });

  // State for events data
  const [events, setEvents] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    pages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState({
    isOpen: false,
    message: "",
    status: "",
  });

  // State for user interactions with events
  const [userStatus, setUserStatus] = useState({});
  const [editingEvent, setEditingEvent] = useState(null);

  // Show modal helper
  const showModal = (message, status) => {
    setModal({
      isOpen: true,
      message,
      status,
    });
  };

  // Load user preferences on mount
  useEffect(() => {
    if (isLoaded && user) {
      const userPrefs = user.publicMetadata?.eventPrefs || {};
      setPrefs({
        weekly: !!userPrefs.weekly,
        monthly: !!userPrefs.monthly,
        yearly: !!userPrefs.yearly,
      });
      fetchUserEventStatus();
    }
  }, [isLoaded, user]);

  const handleEventUpdate = (updatedEvent) => {
    setEvents((prev) =>
      prev.map((e) => (e._id === updatedEvent._id ? updatedEvent : e))
    );
  };

  // Build query string for fetching events
  const getQueryString = useCallback(() => {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("limit", limit.toString());
    params.append("sortBy", sortBy);
    params.append("sortOrder", sortOrder);
    if (search) params.append("search", search);
    if (filter.featured) params.append("featured", "true");
    if (filter.completed) params.append("completed", "true");
    if (filter.canceled) params.append("canceled", "true");

    // Calculate date range based on scope
    const now = new Date();
    let startDate, endDate;
    if (scope === "weekly") {
      const day = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
      startDate = new Date(now);
      startDate.setDate(now.getDate() - day); // Start of week (Sunday)
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6); // End of week
    } else if (scope === "monthly") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else if (scope === "yearly") {
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31);
    }

    if (startDate && endDate) {
      params.append("startDate", startDate.toISOString().split("T")[0]);
      params.append("endDate", endDate.toISOString().split("T")[0]);
    }

    return params.toString();
  }, [scope, page, limit, sortBy, sortOrder, search, filter]);

  // Fetch events based on current filters
  const fetchEvents = useCallback(
    async (overrideQueryString = null) => {
      if (!isLoaded) return;

      setLoading(true);
      setError("");

      try {
        const queryString = overrideQueryString || getQueryString();
        console.log("Fetching events with query:", queryString); // Debugging
        const res = await fetch(`/api/events?${queryString}`);

        if (!res.ok) {
          throw new Error("Failed to fetch events");
        }

        const data = await res.json();
        console.log("Received data:", data); // Debugging
        setEvents(data.events || []);
        setPagination(
          data.pagination || {
            total: 0,
            page: 1,
            limit,
            pages: 3,
          }
        );
      } catch (err) {
        console.error("Error fetching events:", err);
        setError("Unable to fetch events. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [isLoaded, getQueryString, limit]
  );

  // Fetch user's status for events (interested, notifications)
  const fetchUserEventStatus = useCallback(async () => {
    if (!isLoaded || !user) return;

    try {
      const newUserStatus = {};
      for (const event of events) {
        newUserStatus[event._id] = {
          interested: event.interestedUsers?.includes(user.id) || false,
          notified: event.notificationWants?.includes(user.id) || false,
        };
      }
      setUserStatus(newUserStatus);
    } catch (err) {
      console.error("Error fetching user event status:", err);
    }
  }, [isLoaded, user, events]);

  // Update user notification preferences
  const savePreferences = async () => {
    if (!isLoaded || !user) {
      showModal("পছন্দ ঠিক করতে আগে লগিন করতে হবে!", "error");
      return;
    }

    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventPrefs: prefs, userId: user.id }),
      });

      if (!res.ok) {
        throw new Error("Failed to save preferences");
      }

      showModal("নোটিফিকেশন পছন্দ সংরক্ষণ করা হয়েছে!", "success");
    } catch (err) {
      console.error("Error saving preferences:", err);
      showModal("পছন্দ সংরক্ষণে কোন সমস্যা হয়েছে!", "error");
    }
  };

  // Toggle notification preference for a scope
  const togglePref = (scopeValue) => {
    setPrefs((prev) => ({
      ...prev,
      [scopeValue]: !prev[scopeValue],
    }));
  };

  // Handle event interest toggle
  const handleToggleInterest = async (eventId) => {
    if (!isLoaded || !user) {
      showModal("আগ্রহী হওয়ার জন্য দয়া করে আগে লগিন করে নিন!", "error");
      return;
    }

    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggleInterest" }),
      });

      if (!res.ok) {
        throw new Error("Failed to update interest");
      }

      const data = await res.json();
      setEvents((prev) =>
        prev.map((e) => (e._id === eventId ? data.event : e))
      );
      setUserStatus((prev) => ({
        ...prev,
        [eventId]: data.userStatus,
      }));
      showModal(
        data.userStatus.interested
          ? "আপনি এখন এই মাহফিলে আগ্রহী!"
          : "আপনি এখন আর এই মাহফিলে আগ্রহী নন!",
        "success"
      );
    } catch (err) {
      console.error("Error toggling interest:", err);
      showModal("Failed to update interest", "error");
    }
  };

  // Handle notification toggle for specific event
  const handleToggleNotification = async (eventId) => {
    if (!isLoaded || !user) {
      showModal("নোটিফিকেশন পাওয়ার জন্য দয়া করে আগে লগিন করে নিন!", "error");
      return;
    }

    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggleNotification" }),
      });

      if (!res.ok) {
        throw new Error("Failed to update notification preferences");
      }

      const data = await res.json();
      setEvents((prev) =>
        prev.map((e) => (e._id === eventId ? data.event : e))
      );
      setUserStatus((prev) => ({
        ...prev,
        [eventId]: data.userStatus,
      }));
      showModal(
        data.userStatus.notified
          ? "আপনাকে এই মাহফিলের ব্যাপারে ১ ঘন্টা আগে জানানো হবে!"
          : "আপনাকে এই মাহফিলের ব্যাপারে জানানো হবে না!",
        "success"
      );
    } catch (err) {
      console.error("Error toggling notification:", err);
      showModal("নোটিফিকেশন সিস্টেম আপডেট করতে একটু সমস্যা হয়েছে!", "error");
    }
  };

  // Admin functions
  const handleToggleComplete = async (eventId) => {
    if (!isAdmin) return;

    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggleComplete" }),
      });

      if (!res.ok) {
        throw new Error("Failed to update event status");
      }

      const data = await res.json();
      setEvents((prev) =>
        prev.map((e) => (e._id === eventId ? data.event : e))
      );
      showModal(
        `Event marked as ${data.event.completed ? "completed" : "incomplete"}`,
        "success"
      );
    } catch (err) {
      console.error("Error updating event status:", err);
      showModal("মাহফিলের অবস্থা আপডেট করতে সমস্যা হয়েছে!", "error");
    }
  };

  const handleToggleCancel = async (eventId) => {
    if (!isAdmin) return;

    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggleCancel" }),
      });

      if (!res.ok) {
        throw new Error("Failed to update event status");
      }

      const data = await res.json();
      setEvents((prev) =>
        prev.map((e) => (e._id === eventId ? data.event : e))
      );
      showModal(
        `Event ${data.event.canceled ? "canceled" : "restored"}`,
        "success"
      );
    } catch (err) {
      console.error("Error updating event status:", err);
      showModal("মাহফিলের অবস্থা আপডেট করতে সমস্যা হয়েছে!", "error");
    }
  };

  const handleToggleFeatured = async (eventId) => {
    if (!isAdmin) return;

    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggleFeatured" }),
      });

      if (!res.ok) {
        throw new Error("Failed to update featured status");
      }

      const data = await res.json();
      setEvents((prev) =>
        prev.map((e) => (e._id === eventId ? data.event : e))
      );
      showModal(
        `Event ${data.event.featured ? "featured" : "unfeatured"}`,
        "success"
      );
    } catch (err) {
      console.error("Error updating featured status:", err);
      showModal("মাহফিলকে বিশেষায়িত করতে সমস্যা হয়েছে!", "error");
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!isAdmin) return;

    if (
      !window.confirm(
        "Are you sure you want to delete this event? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete event");
      }

      setEvents((prev) => prev.filter((e) => e._id !== eventId));
      showModal("মাহফিল ডিলিট সম্পন্ন হয়েছে!", "success");
    } catch (err) {
      console.error("Error deleting event:", err);
      showModal("মাহফিল ডিলিটে সমস্যা হয়েছে!", "error");
    }
  };

  // Format dates for display
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Effect to fetch events when filters change
  useEffect(() => {
    if (isLoaded) {
      fetchEvents();
    }
  }, [isLoaded, fetchEvents]);

  // Effect to update user event status when events change
  useEffect(() => {
    if (isLoaded && user && events.length > 0) {
      fetchUserEventStatus();
    }
  }, [isLoaded, user, events, fetchUserEventStatus]);

  // Generate page numbers for pagination
  const pageNumbers = useMemo(() => {
    const total = pagination.pages;
    const current = pagination.page;
    const delta = 1;

    if (total <= 5) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const pages = [];
    const leftBound = Math.max(1, current - delta);
    const rightBound = Math.min(total, current + delta);

    if (leftBound > 1) {
      pages.push(1);
      if (leftBound > 2) pages.push("...");
    }

    for (let i = leftBound; i <= rightBound; i++) {
      pages.push(i);
    }

    if (rightBound < total) {
      if (rightBound < total - 1) pages.push("...");
      pages.push(total);
    }

    return pages;
  }, [pagination.pages, pagination.page]);

  // Handle pagination
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setPage(newPage);
    }
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchEvents();
  };

  const handleMonthChange = (newDate) => {
    const firstDayOfMonth = new Date(
      newDate.getFullYear(),
      newDate.getMonth(),
      1
    );
    const lastDayOfMonth = new Date(
      newDate.getFullYear(),
      newDate.getMonth() + 1,
      0
    );

    const params = new URLSearchParams(getQueryString());
    params.set("startDate", firstDayOfMonth.toISOString().split("T")[0]);
    params.set("endDate", lastDayOfMonth.toISOString().split("T")[0]);

    fetchEvents(params.toString());
  };

  // Toggle filter options
  const toggleFilter = (key) => {
    setFilter((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 md:p-6">
      <div className="space-y-6">
        {/* Hero */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <h1 className="text-3xl md:text-4xl font-bold">
            আমাদের কর্মসূচীসমূহ
          </h1>
          <div className="flex items-center space-x-2">
            {isAdmin && (
              <Link href="/dashboard?tab=events">
                <button className="flex items-center px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                  <FiPlus className="mr-1" />
                  নতুন মাহফিল
                </button>
              </Link>
            )}
            <button
              onClick={() => {
                setView("calendar");
                localStorage.setItem("EventView", "calendar");
              }}
              className={`p-2 rounded ${
                view === "calendar"
                  ? "bg-teal-600 text-white"
                  : "hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              <FiCalendar size={20} />
            </button>
            <button
              onClick={() => {
                setView("list");
                localStorage.setItem("EventView", "list");
              }}
              className={`p-2 rounded ${
                view === "list"
                  ? "bg-teal-600 text-white"
                  : "hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              <FiList size={20} />
            </button>
          </div>
        </header>

        {/* Tabs + search/filters */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex space-x-2">
            {SCOPES.map((s) => (
              <button
                key={s.value}
                onClick={() => {
                  setScope(s.value);
                  setPage(1);
                }}
                className={`px-4 py-2 rounded-full ${
                  scope === s.value
                    ? "bg-teal-600 text-white"
                    : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 items-stretch sm:items-center w-full sm:w-auto">
            <form onSubmit={handleSearch} className="flex flex-1">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search events…"
                className="px-3 py-2 border rounded-l dark:bg-gray-800 flex-1"
              />
              <button
                type="submit"
                className="px-3 py-2 bg-teal-600 text-white rounded-r"
              >
                Search
              </button>
            </form>
            <Menu as="div" className="relative">
              <Menu.Button className="flex items-center px-3 py-2 border rounded dark:bg-gray-800">
                <FiFilter className="mr-1" />
                Filters
              </Menu.Button>
              <Menu.Items className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border rounded shadow-lg focus:outline-none z-10">
                <div className="p-3">
                  <p className="text-sm font-medium mb-2">Event Status</p>
                  <label className="flex items-center space-x-2 mt-2">
                    <input
                      type="checkbox"
                      checked={filter.featured}
                      onChange={() => toggleFilter("featured")}
                      className="form-checkbox h-4 w-4 text-teal-600"
                    />
                    <span>Featured</span>
                  </label>
                  <label className="flex items-center space-x-2 mt-2">
                    <input
                      type="checkbox"
                      checked={filter.completed}
                      onChange={() => toggleFilter("completed")}
                      className="form-checkbox h-4 w-4 text-teal-600"
                    />
                    <span>Completed</span>
                  </label>
                  <label className="flex items-center space-x-2 mt-2">
                    <input
                      type="checkbox"
                      checked={filter.canceled}
                      onChange={() => toggleFilter("canceled")}
                      className="form-checkbox h-4 w-4 text-teal-600"
                    />
                    <span>Canceled</span>
                  </label>
                  <hr className="my-2 border-gray-200 dark:border-gray-700" />
                  <p className="text-sm font-medium mb-2">Sort By</p>
                  <select
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value);
                      setPage(1);
                    }}
                    className="w-full p-1 text-sm border rounded dark:bg-gray-700"
                  >
                    <option value="startDate">Date</option>
                    <option value="title">Title</option>
                    <option value="createdAt">Created</option>
                  </select>
                  <div className="flex mt-2">
                    <button
                      onClick={() => {
                        setSortOrder("asc");
                        setPage(1);
                      }}
                      className={`flex-1 p-1 text-xs ${
                        sortOrder === "asc"
                          ? "bg-teal-100 dark:bg-teal-900"
                          : "bg-gray-100 dark:bg-gray-700"
                      } rounded-l`}
                    >
                      Ascending
                    </button>
                    <button
                      onClick={() => {
                        setSortOrder("desc");
                        setPage(1);
                      }}
                      className={`flex-1 p-1 text-xs ${
                        sortOrder === "desc"
                          ? "bg-teal-100 dark:bg-teal-900"
                          : "bg-gray-100 dark:bg-gray-700"
                      } rounded-r`}
                    >
                      Descending
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      setFilter({
                        featured: false,
                        completed: false,
                        canceled: false,
                      });
                      setSortBy("startDate");
                      setSortOrder("asc");
                      setSearch("");
                      setPage(1);
                    }}
                    className="w-full mt-3 px-2 py-1 text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded"
                  >
                    Clear All Filters
                  </button>
                </div>
              </Menu.Items>
            </Menu>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex flex-col sm:flex-row justify-between">
            <div className="flex flex-wrap gap-4 items-center mb-3 sm:mb-0">
              <span className="font-medium">Notify me about:</span>
              {SCOPES.map((s) => (
                <label
                  key={s.value}
                  className="inline-flex items-center space-x-2"
                >
                  <input
                    type="checkbox"
                    checked={prefs[s.value]}
                    onChange={() => togglePref(s.value)}
                    className="form-checkbox h-5 w-5 text-teal-600"
                  />
                  <span>{s.label}</span>
                </label>
              ))}
            </div>
            <button
              onClick={savePreferences}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded"
            >
              Save Preferences
            </button>
          </div>
        </div>

        {/* Data / Loading / Error */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-200 px-4 py-3 rounded relative">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl font-semibold">No events found</p>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Try changing your search criteria or filters
            </p>
          </div>
        ) : view === "calendar" ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <CalendarView
              events={events}
              scope={scope}
              userStatus={userStatus}
              handleToggleInterest={handleToggleInterest}
              handleToggleNotification={handleToggleNotification}
              handleSetViewingEvent={setViewingEvent}
              isAdmin={isAdmin}
              handleToggleComplete={handleToggleComplete}
              handleToggleCancel={handleToggleCancel}
              handleToggleFeatured={handleToggleFeatured}
              handleDeleteEvent={handleDeleteEvent}
              setEditingEvent={setEditingEvent}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <div
                key={event._id}
                className={`
                  bg-white dark:bg-gray-800 border rounded-lg p-5 flex flex-col justify-between shadow 
                  ${event.canceled ? "border-red-500 dark:border-red-700" : ""} 
                  ${
                    event.completed
                      ? "border-green-500 dark:border-green-700"
                      : ""
                  }
                  ${
                    event.featured
                      ? "ring-2 ring-yellow-400 dark:ring-yellow-600"
                      : ""
                  }
                `}
              >
                {/* Status indicators */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {event.featured && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 text-xs rounded-full flex items-center">
                      <FiStar className="mr-1" /> Featured
                    </span>
                  )}
                  {event.completed && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs rounded-full flex items-center">
                      <FiCheck className="mr-1" /> Completed
                    </span>
                  )}
                  {event.canceled && (
                    <span className="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-xs rounded-full flex items-center">
                      <FiX className="mr-1" /> Canceled
                    </span>
                  )}
                </div>

                {/* Event details */}
                <div>
                  <h2 className="text-xl font-semibold mb-2">{event.title}</h2>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-2 flex flex-col space-y-1">
                    <div className="flex items-center">
                      <FiCalendar className="mr-2" />
                      <span>{formatDate(event.startDate)}</span>
                      {event.scheduledTime && (
                        <span className="ml-2">
                          {formatTime(event.scheduledTime)}
                        </span>
                      )}
                    </div>
                    {event.location && (
                      <div className="flex items-center">
                        <FiMap className="mr-2" />
                        <span>{event.location}</span>
                      </div>
                    )}
                  </div>

                  {event.description && (
                    <p className="text-sm mb-4 line-clamp-3 whitespace-pre-wrap">
                      {event.description}
                    </p>
                  )}
                </div>

                {/* Event interactions */}
                <div className="mt-4">
                  {/* User actions */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    <button
                      onClick={() => handleToggleInterest(event._id)}
                      className={`flex items-center space-x-1 px-3 py-1 rounded text-sm ${
                        userStatus[event._id]?.interested
                          ? "bg-teal-600 text-white"
                          : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                      }`}
                      disabled={event.canceled}
                    >
                      <FiStar size={16} />
                      <span>
                        {userStatus[event._id]?.interested
                          ? "Interested"
                          : "Interest"}
                      </span>
                    </button>
                    <button
                      onClick={() => handleToggleNotification(event._id)}
                      className={`flex items-center space-x-1 px-3 py-1 rounded text-sm ${
                        userStatus[event._id]?.notified
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                      }`}
                      disabled={event.canceled}
                    >
                      <FiBell size={16} />
                      <span>
                        {userStatus[event._id]?.notified
                          ? "Notifying"
                          : "Notify Me"}
                      </span>
                    </button>
                    <button
                      onClick={() => setViewingEvent(event)}
                      className="flex items-center space-x-1 px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 text-sm"
                    >
                      <span>Details</span>
                    </button>
                  </div>

                  {/* Admin actions */}
                  {isAdmin && (
                    <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t dark:border-gray-700">
                      <button
                        onClick={() => setEditingEvent(event)}
                        className="flex items-center space-x-1 px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded text-xs"
                      >
                        <FiEdit size={14} />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleToggleComplete(event._id)}
                        className="flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded text-xs"
                      >
                        <FiCheck size={14} />
                        <span>
                          {event.completed ? "Mark Incomplete" : "Complete"}
                        </span>
                      </button>
                      <button
                        onClick={() => handleToggleCancel(event._id)}
                        className="flex items-center space-x-1 px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded text-xs"
                      >
                        <FiAlertCircle size={14} />
                        <span>{event.canceled ? "Restore" : "Cancel"}</span>
                      </button>
                      <button
                        onClick={() => handleToggleFeatured(event._id)}
                        className="flex items-center space-x-1 px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded text-xs"
                      >
                        <FiStar size={14} />
                        <span>{event.featured ? "Unfeature" : "Feature"}</span>
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(event._id)}
                        className="flex items-center space-x-1 px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded text-xs"
                      >
                        <FiTrash2 size={14} />
                        <span>Delete</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && events.length > 0 && (
          <nav className="flex justify-center mt-6 space-x-2">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className={`px-3 py-1 rounded flex items-center ${
                page === 1
                  ? "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600 cursor-not-allowed"
                  : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              <FiChevronLeft />
            </button>

            {pageNumbers.map((num, idx) =>
              num === "..." ? (
                <span key={`ellipsis-${idx}`} className="px-3 py-1">
                  ...
                </span>
              ) : (
                <button
                  key={num}
                  onClick={() => handlePageChange(num)}
                  className={`px-3 py-1 rounded ${
                    num === page
                      ? "bg-teal-600 text-white"
                      : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                  }`}
                >
                  {num}
                </button>
              )
            )}

            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page === pagination.pages}
              className={`px-3 py-1 rounded flex items-center ${
                page === pagination.pages
                  ? "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600 cursor-not-allowed"
                  : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              <FiChevronRight />
            </button>
          </nav>
        )}
      </div>

      {editingEvent && (
        <EventInputModal
          event={editingEvent}
          onClose={() => setEditingEvent(null)}
        />
      )}
      {viewingEvent && (
        <EventDetailModal
          event={viewingEvent}
          onClose={() => setViewingEvent(null)}
          onEventUpdate={handleEventUpdate}
          onEventDelete={handleDeleteEvent}
        />
      )}
      {/* Response Modal */}
      <ResponseModal
        isOpen={modal.isOpen}
        message={modal.message}
        status={modal.status}
        onClose={() => setModal({ ...modal, isOpen: false })}
      />
    </div>
  );
}
