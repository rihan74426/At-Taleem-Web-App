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
import EventSkeleton from "../Components/EventSkeleton";

const SCOPES = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

export default function ProgrammePage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const isAdmin = user?.publicMetadata?.isAdmin;

  // Core view states
  const [view, setView] = useState(
    typeof window !== "undefined"
      ? localStorage.getItem("EventView") || "calendar"
      : "calendar"
  );
  const [scope, setScope] = useState(null);

  // Simplified date state - just track month and year
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  // List view specific states
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [sortBy, setSortBy] = useState("startDate");
  const [sortOrder, setSortOrder] = useState("asc");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState({
    featured: false,
    completed: false,
    canceled: false,
  });

  // Data and UI states
  const [events, setEvents] = useState([]);
  const [monthInfo, setMonthInfo] = useState({
    currentMonth: new Date().getMonth() + 1,
    currentYear: new Date().getFullYear(),
    nextMonth: null,
    nextYear: null,
    prevMonth: null,
    prevYear: null,
  });
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 1,
  });
  const [prefs, setPrefs] = useState({
    weekly: false,
    monthly: false,
    yearly: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState({
    isOpen: false,
    message: "",
    status: "",
  });
  const [viewingEvent, setViewingEvent] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);

  // Simplified query string builder
  const buildQueryString = useCallback(
    (options = {}) => {
      const params = new URLSearchParams();
      const effectiveView = options.view || view;

      // Add scope parameter
      params.append("scope", options.scope || scope);

      if (effectiveView === "calendar") {
        params.append("month", (options.month || currentMonth).toString());
        params.append("year", (options.year || currentYear).toString());
      } else {
        params.append("page", (options.page || page).toString());
        params.append("limit", limit.toString());
      }

      params.append("sortBy", options.sortBy || sortBy);
      params.append("sortOrder", options.sortOrder || sortOrder);

      if (effectiveView === "list" && (options.search ?? search)) {
        params.append("search", options.search ?? search);
      }

      const activeFilter = options.filter ?? filter;
      Object.entries(activeFilter).forEach(([key, value]) => {
        if (value) params.append(key, "true");
      });

      return params.toString();
    },
    [
      view,
      currentMonth,
      currentYear,
      page,
      limit,
      sortBy,
      sortOrder,
      search,
      filter,
      scope,
    ]
  );

  // Event fetching function
  const fetchEvents = useCallback(
    async (options = {}) => {
      if (!isLoaded) return;

      setLoading(true);
      setError("");

      try {
        const queryString = buildQueryString(options);
        const res = await fetch(`/api/events?${queryString}`, {
          cache: "no-store",
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP error! ${res.status}`);
        }

        const data = await res.json();

        // Atomic state updates
        setEvents(data.events || []);
        const effectiveView = options.view ?? view;

        setPagination((prev) => ({
          ...prev,
          ...(effectiveView === "calendar"
            ? { page: 1, total: data.events?.length || 0 }
            : data.pagination),
        }));

        if (data.monthInfo && effectiveView === "calendar") {
          setMonthInfo(data.monthInfo);
        }

        // Batch state updates
        setCurrentMonth(
          options.month ??
            (effectiveView === "calendar"
              ? currentMonth
              : new Date().getMonth() + 1)
        );
        setCurrentYear(
          options.year ??
            (effectiveView === "calendar"
              ? currentYear
              : new Date().getFullYear())
        );
      } catch (err) {
        setError(err.message || "Failed to fetch events");
        setModal({
          isOpen: true,
          message: err.message || "Failed to fetch events",
          status: "error",
        });
      } finally {
        setLoading(false);
      }
    },
    [isLoaded, buildQueryString, view, currentMonth, currentYear]
  );

  // Month navigation handlers
  const handlePreviousMonth = useCallback(() => {
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    fetchEvents({
      month: prevMonth,
      year: prevYear,
      view: "calendar",
    });
  }, [currentMonth, currentYear, fetchEvents]);

  const handleNextMonth = useCallback(() => {
    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
    const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;

    fetchEvents({
      month: nextMonth,
      year: nextYear,
      view: "calendar",
    });
  }, [currentMonth, currentYear, fetchEvents]);

  const handleMonthChange = useCallback(
    (newMonth, newYear) => {
      fetchEvents({
        month: newMonth,
        year: newYear,
        view: "calendar",
      });
    },
    [fetchEvents]
  );

  // Scope change handler
  const handleScopeChange = useCallback(
    (newScope) => {
      // If clicking the same scope, clear it (show all events)
      const effectiveScope = scope === newScope ? null : newScope;
      setScope(effectiveScope);
      fetchEvents({ scope: effectiveScope });
    },
    [fetchEvents, scope]
  );

  // View change handler
  const handleViewChange = useCallback(
    (newView) => {
      setView(newView);
      if (typeof window !== "undefined") {
        localStorage.setItem("EventView", newView);
      }
      setPage(1);
      fetchEvents({ view: newView, page: 1 });
    },
    [fetchEvents]
  );

  // Initial fetch and effects
  useEffect(() => {
    if (isLoaded) {
      fetchEvents({ scope });
    }
  }, [isLoaded, fetchEvents, scope]);

  // Debounced search with cleanup
  useEffect(() => {
    if (!isLoaded) return;

    const handler = setTimeout(() => {
      setPage(1);
      fetchEvents({ page: 1 });
    }, 300);

    return () => clearTimeout(handler);
  }, [search, filter, isLoaded]);

  // User interaction handlers
  const togglePref = (scopeValue) =>
    setPrefs((prev) => ({ ...prev, [scopeValue]: !prev[scopeValue] }));

  const savePreferences = async () => {
    if (!isLoaded || !user)
      return setModal({
        isOpen: true,
        message: "দয়া করে আগে লগইন করুন!",
        status: "error",
      });

    try {
      // Request notification permission if any preference is being enabled
      const hasNewEnabledPrefs = Object.entries(prefs).some(
        ([key, value]) => value && !user.publicMetadata?.eventPrefs?.[key]
      );

      if (hasNewEnabledPrefs) {
        await requestNotificationPermission();
      }

      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventPrefs: prefs, userId: user.id }),
      });
      if (!res.ok) throw new Error("Failed to save preferences");
      setModal({
        isOpen: true,
        message: "পছন্দসমূহ সফলভাবে সংরক্ষণ করা হয়েছে!",
        status: "success",
      });
    } catch (err) {
      setModal({
        isOpen: true,
        message: "পছন্দসমূহ সংরক্ষণ করতে সমস্যা হয়েছে!",
        status: "error",
      });
    }
  };

  const handleToggleInterest = async (eventId) => {
    if (!user)
      return setModal({
        isOpen: true,
        message: "দয়া করে আগে লগইন করুন!",
        status: "error",
      });
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggleInterest", userId: user.id }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! ${res.status}`);
      }

      const data = await res.json();

      // Update events state with the new event data
      setEvents((prev) =>
        prev.map((e) => (e._id === eventId ? data.event : e))
      );

      // Show appropriate message based on the updated event data
      const isInterested = data.event.interestedUsers?.includes(user.id);
      setModal({
        isOpen: true,
        message: isInterested
          ? "আপনি এই মাহফিলে আগ্রহী!"
          : "আপনি এই মাহফিলে আগ্রহী নন!",
        status: "success",
      });
    } catch (err) {
      setModal({
        isOpen: true,
        message: `আগ্রহ প্রকাশ করতে সমস্যা হয়েছে: ${err.message}`,
        status: "error",
      });
    }
  };

  const requestNotificationPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        // Register service worker for push notifications
        const registration = await navigator.serviceWorker.register("/sw.js");
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        });

        // Send subscription to server
        await fetch("/api/notifications/subscribe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            subscription,
            userId: user.id,
          }),
        });

        return true;
      }
      return false;
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  };

  const handleToggleNotification = async (eventId) => {
    if (!user)
      return setModal({
        isOpen: true,
        message: "দয়া করে আগে লগইন করুন!",
        status: "error",
      });
    try {
      await requestNotificationPermission();

      const res = await fetch(`/api/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggleNotification", userId: user.id }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! ${res.status}`);
      }

      const data = await res.json();

      // Update events state with the new event data
      setEvents((prev) =>
        prev.map((e) => (e._id === eventId ? data.event : e))
      );

      // Show appropriate message based on the updated event data
      const isNotifying = data.event.notificationWants?.includes(user.id);
      setModal({
        isOpen: true,
        message: isNotifying
          ? "আপনাকে এই মাহফিলের ব্যাপারে ১ ঘন্টা আগে জানানো হবে!"
          : "আপনাকে এই মাহফিলের ব্যাপারে জানানো হবে না!",
        status: "success",
      });
    } catch (err) {
      setModal({
        isOpen: true,
        message: `নোটিফিকেশন সিস্টেম আপডেট করতে একটু সমস্যা হয়েছে: ${err.message}`,
        status: "error",
      });
    }
  };

  // Admin handlers
  const handleAdminAction = async (eventId, action, successMessage) => {
    if (!isAdmin) return;
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, userId: user.id }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to ${action}`);
      }

      const data = await res.json();

      // Update events state with the new event data
      setEvents((prev) =>
        prev.map((e) => (e._id === eventId ? data.event : e))
      );

      setModal({
        isOpen: true,
        message: successMessage(data.event),
        status: "success",
      });
    } catch (err) {
      setModal({
        isOpen: true,
        message: `Error ${action}ing event: ${err.message}`,
        status: "error",
      });
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (
      !isAdmin ||
      !window.confirm("Are you sure you want to delete this event?")
    )
      return;
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to delete");
      }

      // Remove the deleted event from state
      setEvents((prev) => prev.filter((e) => e._id !== eventId));

      setModal({
        isOpen: true,
        message: "Event deleted successfully!",
        status: "success",
      });
    } catch (err) {
      setModal({
        isOpen: true,
        message: `Error deleting event: ${err.message}`,
        status: "error",
      });
    }
  };

  // Utility functions
  const formatDate = (dateStr) =>
    dateStr
      ? new Date(dateStr).toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "";
  const formatTime = (dateStr) =>
    dateStr
      ? new Date(dateStr).toLocaleTimeString(undefined, {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";

  const pageNumbers = useMemo(() => {
    const total = pagination.pages;
    const current = pagination.page;
    if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
    const delta = 1;
    const pages = [];
    const left = Math.max(1, current - delta);
    const right = Math.min(total, current + delta);
    if (left > 1) pages.push(1, left > 2 ? "..." : null);
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < total) pages.push(right < total - 1 ? "..." : null, total);
    return pages.filter(Boolean);
  }, [pagination.pages, pagination.page]);

  // User preferences effect
  useEffect(() => {
    if (isLoaded && user) {
      setPrefs(
        user.publicMetadata?.eventPrefs || {
          weekly: false,
          monthly: false,
          yearly: false,
        }
      );
    }
  }, [isLoaded, user]);

  // Get month label for display
  const getMonthLabel = () => {
    const date = new Date(currentYear, currentMonth - 1);
    return date.toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
        <EventSkeleton />
      </div>
    );
  }

  // Render
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 md:p-6">
      <div className="space-y-6">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <h1 className="text-3xl md:text-4xl font-bold">
            আমাদের কর্মসূচীসমূহ
          </h1>
          <div className="flex items-center space-x-2">
            {isAdmin && (
              <Link href="/dashboard?tab=events">
                <button className="flex items-center px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                  <FiPlus className="mr-1" /> নতুন মাহফিল
                </button>
              </Link>
            )}
            <button
              onClick={() => handleViewChange("calendar")}
              className={`p-2 rounded ${
                view === "calendar"
                  ? "bg-teal-600 text-white"
                  : "hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              <FiCalendar size={20} />
            </button>
            <button
              onClick={() => handleViewChange("list")}
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

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex space-x-2">
            <button
              onClick={() => handleScopeChange(null)}
              className={`px-4 py-2 rounded-full ${
                scope === null
                  ? "bg-teal-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              All Events
            </button>
            {SCOPES.map((s) => (
              <button
                key={s.value}
                onClick={() => handleScopeChange(s.value)}
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
          {view === "list" && (
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 items-stretch sm:items-center w-full sm:w-auto">
              <div className="flex flex-1">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search events…"
                  className="px-3 py-2 border rounded-l dark:bg-gray-800 flex-1"
                />
                <button
                  onClick={() => {
                    setPage(1);
                    fetchEvents();
                  }}
                  className="px-3 py-2 bg-teal-600 text-white rounded-r"
                >
                  Search
                </button>
              </div>
              <Menu as="div" className="relative">
                <Menu.Button className="flex items-center px-3 py-2 border rounded dark:bg-gray-800">
                  <FiFilter className="mr-1" /> Filters
                </Menu.Button>
                <Menu.Items className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border rounded shadow-lg focus:outline-none z-10">
                  <div className="p-3">
                    <p className="text-sm font-medium mb-2">Event Status</p>
                    {["featured", "completed", "canceled"].map((key) => (
                      <label
                        key={key}
                        className="flex items-center space-x-2 mt-2"
                      >
                        <input
                          type="checkbox"
                          checked={filter[key]}
                          onChange={() => {
                            setFilter((p) => ({ ...p, [key]: !p[key] }));
                            setPage(1);
                          }}
                          className="form-checkbox h-4 w-4 text-teal-600"
                        />
                        <span>
                          {key.charAt(0).toUpperCase() + key.slice(1)}
                        </span>
                      </label>
                    ))}
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
                      Clear All
                    </button>
                  </div>
                </Menu.Items>
              </Menu>
            </div>
          )}
        </div>

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

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-200 px-4 py-3 rounded">
            {error}
          </div>
        ) : view === "calendar" ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <button
                onClick={handlePreviousMonth}
                className="flex items-center px-3 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded"
              >
                <FiChevronLeft className="mr-1" /> Previous
              </button>
              <h2 className="text-xl font-semibold">{getMonthLabel()}</h2>
              <button
                onClick={handleNextMonth}
                className="flex items-center px-3 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded"
              >
                Next <FiChevronRight className="ml-1" />
              </button>
            </div>
            <CalendarView
              events={events}
              scope={scope}
              currentDate={new Date(currentYear, currentMonth - 1)}
              setCurrentDate={(date) => {
                setCurrentMonth(date.getMonth() + 1);
                setCurrentYear(date.getFullYear());
              }}
              onMonthChange={handleMonthChange}
              fetchEvents={fetchEvents}
              user={user}
              handleToggleInterest={handleToggleInterest}
              handleToggleNotification={handleToggleNotification}
              handleSetViewingEvent={setViewingEvent}
              isAdmin={isAdmin}
              handleToggleComplete={(id) =>
                handleAdminAction(
                  id,
                  "toggleComplete",
                  (e) =>
                    `Event Marked ${e.completed ? "completed" : "incomplete"}`
                )
              }
              handleToggleCancel={(id) =>
                handleAdminAction(
                  id,
                  "toggleCancel",
                  (e) => `Event Marked ${e.canceled ? "canceled" : "restored"}`
                )
              }
              handleToggleFeatured={(id) =>
                handleAdminAction(
                  id,
                  "toggleFeatured",
                  (e) => `Event Set ${e.featured ? "featured" : "unfeatured"}`
                )
              }
              handleDeleteEvent={handleDeleteEvent}
              setEditingEvent={setEditingEvent}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <div
                key={event._id}
                className={`rounded-xl p-5 shadow transition border dark:border-gray-700 ${
                  event.canceled
                    ? "border-red-500"
                    : event.completed
                    ? "border-green-500"
                    : "border-gray-200 dark:border-gray-700"
                } ${event.featured ? "ring-2 ring-yellow-400" : ""}
        bg-white dark:bg-gray-900`}
              >
                {/* Status Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {event.featured && (
                    <span className="flex items-center px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                      <FiStar className="mr-1" /> Featured
                    </span>
                  )}
                  {event.completed && (
                    <span className="flex items-center px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                      <FiCheck className="mr-1" /> Completed
                    </span>
                  )}
                  {event.canceled && (
                    <span className="flex items-center px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                      <FiX className="mr-1" /> Canceled
                    </span>
                  )}
                </div>

                {/* Event Details */}
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">
                    {event.title}
                  </h2>
                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <div className="flex items-center">
                      <FiCalendar className="mr-2" />
                      {formatDate(event.startDate)}
                      {event.scheduledTime && (
                        <span className="ml-2">
                          {formatTime(event.scheduledTime)}
                        </span>
                      )}
                    </div>
                    {event.location && (
                      <div className="flex items-center">
                        <FiMap className="mr-2" />
                        {event.location}
                      </div>
                    )}
                  </div>
                  {event.description && (
                    <p className="mt-3 text-sm text-gray-700 dark:text-gray-300 line-clamp-3 whitespace-pre-wrap">
                      {event.description}
                    </p>
                  )}
                </div>

                <div className="mt-4 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleToggleInterest(event._id)}
                      disabled={event.canceled}
                      className={`flex items-center px-4 py-2 rounded-full transition-all
              ${
                user.interestedUsers?.includes(user.id)
                  ? "bg-teal-600 text-white hover:bg-teal-700 shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              }`}
                    >
                      <FiStar className="mr-2 w-4 h-4" />
                      <span className="text-sm font-medium">
                        {user.interestedUsers?.includes(user.id)
                          ? "Interested"
                          : "Show Interest"}
                      </span>
                    </button>

                    <button
                      onClick={() => handleToggleNotification(event._id)}
                      disabled={event.canceled}
                      className={`flex items-center px-4 py-2 rounded-full transition-all
              ${
                user.notificationWants?.includes(user.id)
                  ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              }`}
                    >
                      <FiBell className="mr-2 w-4 h-4" />
                      <span className="text-sm font-medium">
                        {user.notificationWants?.includes(user.id)
                          ? "Notifying"
                          : "Notify Me"}
                      </span>
                    </button>
                  </div>

                  {/* Admin Actions */}
                  {isAdmin && (
                    <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => setViewingEvent(event)}
                        className="text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 text-sm font-medium flex items-center"
                      >
                        View Details
                        <FiChevronRight className="ml-1.5 w-4 h-4" />
                      </button>

                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingEvent(event)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300 transition-colors"
                          title="Edit Event"
                        >
                          <FiEdit className="w-5 h-5" />
                        </button>

                        <button
                          onClick={() =>
                            handleAdminAction(event._id, "toggleFeatured")
                          }
                          className={`p-2 rounded-lg transition-colors ${
                            event.featured
                              ? "text-yellow-500 bg-yellow-100/50 dark:bg-yellow-900/20"
                              : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          }`}
                          title={event.featured ? "Unfeature" : "Feature"}
                        >
                          <FiStar className="w-5 h-5" />
                        </button>

                        <button
                          onClick={() =>
                            handleAdminAction(event._id, "toggleComplete")
                          }
                          className={`p-2 rounded-lg transition-colors ${
                            event.completed
                              ? "text-green-500 bg-green-100/50 dark:bg-green-900/20"
                              : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          }`}
                          title={
                            event.completed
                              ? "Mark Incomplete"
                              : "Mark Complete"
                          }
                        >
                          <FiCheck className="w-5 h-5" />
                        </button>

                        <button
                          onClick={() =>
                            handleAdminAction(event._id, "toggleCancel")
                          }
                          className={`p-2 rounded-lg transition-colors ${
                            event.canceled
                              ? "text-red-500 bg-red-100/50 dark:bg-red-900/20"
                              : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          }`}
                          title={
                            event.canceled ? "Restore Event" : "Cancel Event"
                          }
                        >
                          <FiAlertCircle className="w-5 h-5" />
                        </button>

                        <button
                          onClick={() => handleDeleteEvent(event._id)}
                          className="p-2 text-red-500 hover:bg-red-100/50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Delete Event"
                        >
                          <FiTrash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination for List View */}
        {view === "list" && events.length > 0 && (
          <div className="flex justify-center items-center space-x-2 mt-6">
            <button
              onClick={() => {
                setPage(Math.max(1, page - 1));
                fetchEvents({ page: Math.max(1, page - 1) });
              }}
              disabled={page === 1}
              className="px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded disabled:opacity-50"
            >
              Previous
            </button>
            <div className="flex space-x-1">
              {pageNumbers.map((pageNum, idx) =>
                pageNum === "..." ? (
                  <span key={idx} className="px-3 py-2">
                    ...
                  </span>
                ) : (
                  <button
                    key={pageNum}
                    onClick={() => {
                      setPage(pageNum);
                      fetchEvents({ page: pageNum });
                    }}
                    className={`px-3 py-2 rounded ${
                      page === pageNum
                        ? "bg-teal-600 text-white"
                        : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              )}
            </div>
            <button
              onClick={() => {
                setPage(Math.min(pagination.pages, page + 1));
                fetchEvents({ page: Math.min(pagination.pages, page + 1) });
              }}
              disabled={page === pagination.pages}
              className="px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      <ResponseModal
        isOpen={modal.isOpen}
        onClose={() => setModal({ isOpen: false, message: "", status: "" })}
        message={modal.message}
        status={modal.status}
      />

      {viewingEvent && (
        <EventDetailModal
          event={viewingEvent}
          onClose={() => setViewingEvent(null)}
          userStatus={user}
          onToggleInterest={() => handleToggleInterest(viewingEvent._id)}
          onToggleNotification={() =>
            handleToggleNotification(viewingEvent._id)
          }
          isAdmin={isAdmin}
          onToggleComplete={() =>
            handleAdminAction(
              viewingEvent._id,
              "toggleComplete",
              (e) => `Event ${e.completed ? "completed" : "incomplete"}`
            )
          }
          onToggleCancel={() =>
            handleAdminAction(
              viewingEvent._id,
              "toggleCancel",
              (e) => `Event ${e.canceled ? "canceled" : "restored"}`
            )
          }
          onToggleFeatured={() =>
            handleAdminAction(
              viewingEvent._id,
              "toggleFeatured",
              (e) => `Event ${e.featured ? "featured" : "unfeatured"}`
            )
          }
          onDelete={() => handleDeleteEvent(viewingEvent._id)}
          onEdit={() => {
            setEditingEvent(viewingEvent);
            setViewingEvent(null);
          }}
        />
      )}

      {editingEvent && (
        <EventInputModal
          isOpen={true}
          onClose={() => setEditingEvent(null)}
          event={editingEvent}
          onEventSaved={(updatedEvent) => {
            setEvents((prev) =>
              prev.map((e) => (e._id === updatedEvent._id ? updatedEvent : e))
            );
            setEditingEvent(null);
            setModal({
              isOpen: true,
              message: "Event updated successfully!",
              status: "success",
            });
          }}
        />
      )}
    </div>
  );
}
