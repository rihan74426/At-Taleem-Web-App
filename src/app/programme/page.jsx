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

  // Core view states
  const [view, setView] = useState(
    typeof window !== "undefined"
      ? localStorage.getItem("EventView") || "calendar"
      : "calendar"
  );
  const [scope, setScope] = useState("monthly");

  // Simplified date state - just track month and year
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  // List view specific states
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
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
    limit: 20,
    pages: 1,
  });
  const [userStatus, setUserStatus] = useState({});
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

      // Always add month and year for calendar view
      if (view === "calendar" || options.view === "calendar") {
        params.append("month", (options.month || currentMonth).toString());
        params.append("year", (options.year || currentYear).toString());
      } else {
        // For list view, add pagination
        params.append("page", (options.page || page).toString());
        params.append("limit", limit.toString());
      }

      // Add sorting
      params.append("sortBy", options.sortBy || sortBy);
      params.append("sortOrder", options.sortOrder || sortOrder);

      // Add search for list view
      if (view === "list" && (options.search || search)) {
        params.append("search", options.search || search);
      }

      // Add filters
      const activeFilter = options.filter || filter;
      if (activeFilter.featured) params.append("featured", "true");
      if (activeFilter.completed) params.append("completed", "true");
      if (activeFilter.canceled) params.append("canceled", "true");

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

        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

        const data = await res.json();

        setEvents(data.events || []);

        // Update month info if provided (for calendar view)
        if (data.monthInfo) {
          setMonthInfo(data.monthInfo);
        }

        // Update pagination if provided (for list view)
        if (data.pagination) {
          setPagination(data.pagination);
        }

        // Update current month/year if options were provided
        if (options.month) setCurrentMonth(options.month);
        if (options.year) setCurrentYear(options.year);
      } catch (err) {
        setError(err.message || "Failed to fetch events");
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    },
    [isLoaded, buildQueryString]
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

  // Scope change handler (simplified for monthly focus)
  const handleScopeChange = useCallback(
    (newScope) => {
      setScope(newScope);
      setPage(1);

      if (newScope === "monthly") {
        // Reset to current month for monthly view
        const now = new Date();
        fetchEvents({
          month: now.getMonth() + 1,
          year: now.getFullYear(),
          page: 1,
        });
      } else {
        // For other scopes, just refetch with current settings
        fetchEvents({ scope: newScope, page: 1 });
      }
    },
    [fetchEvents]
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
      fetchEvents();
    }
  }, [isLoaded, scope, view, page, sortBy, sortOrder, fetchEvents]);

  // Search effect with debouncing
  useEffect(() => {
    if (isLoaded) {
      const timeoutId = setTimeout(() => {
        setPage(1);
        fetchEvents({ page: 1 });
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  }, [search, filter, isLoaded, fetchEvents]);

  // User status fetching
  const fetchUserEventStatus = useCallback(async () => {
    if (!isLoaded || !user || !events.length) return;
    const newStatus = {};
    events.forEach((event) => {
      newStatus[event._id] = {
        interested: event.interestedUsers?.includes(user.id) || false,
        notified: event.notificationWants?.includes(user.id) || false,
      };
    });
    setUserStatus(newStatus);
  }, [isLoaded, user, events]);

  // User interaction handlers
  const togglePref = (scopeValue) =>
    setPrefs((prev) => ({ ...prev, [scopeValue]: !prev[scopeValue] }));

  const savePreferences = async () => {
    if (!isLoaded || !user)
      return setModal({
        isOpen: true,
        message: "Please login first!",
        status: "error",
      });
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventPrefs: prefs, userId: user.id }),
      });
      if (!res.ok) throw new Error("Failed to save preferences");
      setModal({
        isOpen: true,
        message: "Preferences saved!",
        status: "success",
      });
    } catch (err) {
      setModal({
        isOpen: true,
        message: "Error saving preferences!",
        status: "error",
      });
    }
  };

  const handleToggleInterest = async (eventId) => {
    if (!user)
      return setModal({
        isOpen: true,
        message: "Please login!",
        status: "error",
      });
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggleInterest" }),
      });
      if (!res.ok) throw new Error("Failed to toggle interest");
      const data = await res.json();
      setEvents((prev) =>
        prev.map((e) => (e._id === eventId ? data.event : e))
      );
      setUserStatus((prev) => ({ ...prev, [eventId]: data.userStatus }));
      setModal({
        isOpen: true,
        message: data.userStatus.interested ? "Interested!" : "Not interested!",
        status: "success",
      });
    } catch (err) {
      setModal({
        isOpen: true,
        message: "Error toggling interest",
        status: "error",
      });
    }
  };

  const handleToggleNotification = async (eventId) => {
    if (!user)
      return setModal({
        isOpen: true,
        message: "Please login!",
        status: "error",
      });
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggleNotification" }),
      });
      if (!res.ok) throw new Error("Failed to toggle notification");
      const data = await res.json();
      setEvents((prev) =>
        prev.map((e) => (e._id === eventId ? data.event : e))
      );
      setUserStatus((prev) => ({ ...prev, [eventId]: data.userStatus }));
      setModal({
        isOpen: true,
        message: data.userStatus.notified
          ? "Notification on!"
          : "Notification off!",
        status: "success",
      });
    } catch (err) {
      setModal({
        isOpen: true,
        message: "Error toggling notification",
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
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error(`Failed to ${action}`);
      const data = await res.json();
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
        message: `Error ${action}ing event`,
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
      const res = await fetch(`/api/events/${eventId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setEvents((prev) => prev.filter((e) => e._id !== eventId));
      setModal({ isOpen: true, message: "Event deleted!", status: "success" });
    } catch (err) {
      setModal({
        isOpen: true,
        message: "Error deleting event",
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
      fetchUserEventStatus();
    }
  }, [isLoaded, user, events, fetchUserEventStatus]);

  // Get month label for display
  const getMonthLabel = () => {
    const date = new Date(currentYear, currentMonth - 1);
    return date.toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
    });
  };

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
              userStatus={userStatus}
              handleToggleInterest={handleToggleInterest}
              handleToggleNotification={handleToggleNotification}
              handleSetViewingEvent={setViewingEvent}
              isAdmin={isAdmin}
              handleToggleComplete={(id) =>
                handleAdminAction(
                  id,
                  "toggleComplete",
                  (e) => `Event ${e.completed ? "completed" : "incomplete"}`
                )
              }
              handleToggleCancel={(id) =>
                handleAdminAction(
                  id,
                  "toggleCancel",
                  (e) => `Event ${e.canceled ? "canceled" : "restored"}`
                )
              }
              handleToggleFeatured={(id) =>
                handleAdminAction(
                  id,
                  "toggleFeatured",
                  (e) => `Event ${e.featured ? "featured" : "unfeatured"}`
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
                className={`bg-white dark:bg-gray-800 border rounded-lg p-5 flex flex-col justify-between shadow ${
                  event.canceled
                    ? "border-red-500"
                    : event.completed
                    ? "border-green-500"
                    : ""
                } ${event.featured ? "ring-2 ring-yellow-400" : ""}`}
              >
                <div className="flex flex-wrap gap-2 mb-3">
                  {event.featured && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full flex items-center">
                      <FiStar className="mr-1" /> Featured
                    </span>
                  )}
                  {event.completed && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full flex items-center">
                      <FiCheck className="mr-1" /> Completed
                    </span>
                  )}
                  {event.canceled && (
                    <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full flex items-center">
                      <FiX className="mr-1" /> Canceled
                    </span>
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-semibold mb-2">{event.title}</h2>
                  <div className="text-sm text-gray-500 mb-2 flex flex-col space-y-1">
                    <div className="flex items-center">
                      <FiCalendar className="mr-2" />{" "}
                      {formatDate(event.startDate)}{" "}
                      {event.scheduledTime && (
                        <span className="ml-2">
                          {formatTime(event.scheduledTime)}
                        </span>
                      )}
                    </div>
                    {event.location && (
                      <div className="flex items-center">
                        <FiMap className="mr-2" /> {event.location}
                      </div>
                    )}
                  </div>
                  {event.description && (
                    <p className="text-sm mb-4 line-clamp-3 whitespace-pre-wrap">
                      {event.description}
                    </p>
                  )}
                </div>
                <div className="mt-4">
                  <div className="flex flex-wrap gap-2 mb-3">
                    <button
                      onClick={() => handleToggleInterest(event._id)}
                      className={`flex items-center space-x-1 px-3 py-1 rounded text-sm ${
                        userStatus[event._id]?.interested
                          ? "bg-teal-600 text-white"
                          : "bg-gray-200 hover:bg-gray-300"
                      }`}
                      disabled={event.canceled}
                    >
                      <FiStar size={16} />{" "}
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
                          : "bg-gray-200 hover:bg-gray-300"
                      }`}
                      disabled={event.canceled}
                    >
                      <FiBell size={16} />
                      <span>
                        {userStatus[event._id]?.notified
                          ? "Notified"
                          : "Notify"}
                      </span>
                    </button>
                  </div>
                  <div className="flex justify-between items-center">
                    <button
                      onClick={() => setViewingEvent(event)}
                      className="text-teal-600 hover:text-teal-700 text-sm font-medium"
                    >
                      View Details
                    </button>
                    {isAdmin && (
                      <div className="flex space-x-1">
                        <button
                          onClick={() => setEditingEvent(event)}
                          className="p-1 text-gray-500 hover:text-blue-600"
                          title="Edit Event"
                        >
                          <FiEdit size={16} />
                        </button>
                        <button
                          onClick={() =>
                            handleAdminAction(
                              event._id,
                              "toggleFeatured",
                              (e) =>
                                `Event ${
                                  e.featured ? "featured" : "unfeatured"
                                }`
                            )
                          }
                          className={`p-1 ${
                            event.featured
                              ? "text-yellow-500"
                              : "text-gray-500 hover:text-yellow-600"
                          }`}
                          title="Toggle Featured"
                        >
                          <FiStar size={16} />
                        </button>
                        <button
                          onClick={() =>
                            handleAdminAction(
                              event._id,
                              "toggleComplete",
                              (e) =>
                                `Event ${
                                  e.completed ? "completed" : "incomplete"
                                }`
                            )
                          }
                          className={`p-1 ${
                            event.completed
                              ? "text-green-500"
                              : "text-gray-500 hover:text-green-600"
                          }`}
                          title="Toggle Complete"
                        >
                          <FiCheck size={16} />
                        </button>
                        <button
                          onClick={() =>
                            handleAdminAction(
                              event._id,
                              "toggleCancel",
                              (e) =>
                                `Event ${e.canceled ? "canceled" : "restored"}`
                            )
                          }
                          className={`p-1 ${
                            event.canceled
                              ? "text-red-500"
                              : "text-gray-500 hover:text-red-600"
                          }`}
                          title="Toggle Cancel"
                        >
                          <FiAlertCircle size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(event._id)}
                          className="p-1 text-gray-500 hover:text-red-600"
                          title="Delete Event"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination for List View */}
        {view === "list" && events.length > 0 && pagination.pages > 1 && (
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
          userStatus={userStatus[viewingEvent._id] || {}}
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
