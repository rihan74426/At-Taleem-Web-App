"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
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
  const [view, setView] = useState("list"); // "list" or "calendar"
  const [scope, setScope] = useState("weekly");
  const [page, setPage] = useState(1);
  const [limit] = useState(9); // Items per page
  const [sortBy, setSortBy] = useState("startDate");
  const [sortOrder, setSortOrder] = useState("asc");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState({
    featured: false,
    completed: false,
    canceled: false,
  });

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
    limit: 9,
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
      // Get event preferences from user metadata
      const userPrefs = user.publicMetadata?.eventPrefs || {};
      setPrefs({
        weekly: !!userPrefs.weekly,
        monthly: !!userPrefs.monthly,
        yearly: !!userPrefs.yearly,
      });

      // Also fetch the user's event interactions to display interest/notify status
      fetchUserEventStatus();
    }
  }, [isLoaded, user]);

  // Build query string for fetching events
  const getQueryString = useCallback(() => {
    const params = new URLSearchParams();
    params.append("scope", scope);
    params.append("page", page.toString());
    params.append("limit", limit.toString());
    params.append("sortBy", sortBy);
    params.append("sortOrder", sortOrder);

    if (search) params.append("search", search);
    if (filter.featured) params.append("featured", "true");
    if (filter.completed) params.append("completed", "true");
    if (filter.canceled) params.append("canceled", "true");

    return params.toString();
  }, [scope, page, limit, sortBy, sortOrder, search, filter]);

  // Fetch events based on current filters
  const fetchEvents = useCallback(async () => {
    if (!isLoaded) return;

    setLoading(true);
    setError("");

    try {
      const queryString = getQueryString();
      const res = await fetch(`/api/events?${queryString}`);

      if (!res.ok) {
        throw new Error("Failed to fetch events");
      }

      const data = await res.json();
      setEvents(data.events || []);
      setPagination(
        data.pagination || {
          total: 0,
          page: 1,
          limit,
          pages: 1,
        }
      );
    } catch (err) {
      console.error("Error fetching events:", err);
      setError("Unable to fetch events. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [isLoaded, getQueryString, limit]);

  // Fetch user's status for events (interested, notifications)
  const fetchUserEventStatus = useCallback(async () => {
    if (!isLoaded || !user) return;

    try {
      // This would be a custom endpoint to get all user statuses at once
      // For now we'll track it client-side when users interact with events
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
      showModal("Please sign in to save preferences", "error");
      return;
    }

    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventPrefs: prefs }),
      });

      if (!res.ok) {
        throw new Error("Failed to save preferences");
      }

      showModal("Notification preferences saved!", "success");
    } catch (err) {
      console.error("Error saving preferences:", err);
      showModal("Failed to save preferences", "error");
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
      showModal("Please sign in to express interest", "error");
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

      // Update local state for immediate feedback
      setEvents((prev) =>
        prev.map((e) => (e._id === eventId ? data.event : e))
      );

      setUserStatus((prev) => ({
        ...prev,
        [eventId]: data.userStatus,
      }));

      showModal(
        data.userStatus.interested
          ? "You're now interested in this event!"
          : "You're no longer interested in this event",
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
      showModal("Please sign in to receive notifications", "error");
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

      // Update local state for immediate feedback
      setEvents((prev) =>
        prev.map((e) => (e._id === eventId ? data.event : e))
      );

      setUserStatus((prev) => ({
        ...prev,
        [eventId]: data.userStatus,
      }));

      showModal(
        data.userStatus.notified
          ? "You'll be notified about this event"
          : "You won't be notified about this event",
        "success"
      );
    } catch (err) {
      console.error("Error toggling notification:", err);
      showModal("Failed to update notification preferences", "error");
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

      // Update local state
      setEvents((prev) =>
        prev.map((e) => (e._id === eventId ? data.event : e))
      );

      showModal(
        `Event marked as ${data.event.completed ? "completed" : "incomplete"}`,
        "success"
      );
    } catch (err) {
      console.error("Error updating event status:", err);
      showModal("Failed to update event status", "error");
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

      // Update local state
      setEvents((prev) =>
        prev.map((e) => (e._id === eventId ? data.event : e))
      );

      showModal(
        `Event ${data.event.canceled ? "canceled" : "restored"}`,
        "success"
      );
    } catch (err) {
      console.error("Error updating event status:", err);
      showModal("Failed to update event status", "error");
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

      // Update local state
      setEvents((prev) =>
        prev.map((e) => (e._id === eventId ? data.event : e))
      );

      showModal(
        `Event ${data.event.featured ? "featured" : "unfeatured"}`,
        "success"
      );
    } catch (err) {
      console.error("Error updating featured status:", err);
      showModal("Failed to update featured status", "error");
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

      // Remove from local state
      setEvents((prev) => prev.filter((e) => e._id !== eventId));
      showModal("Event deleted successfully", "success");
    } catch (err) {
      console.error("Error deleting event:", err);
      showModal("Failed to delete event", "error");
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
    const delta = 1; // How many pages to show before and after current page

    if (total <= 5) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const pages = [];
    const leftBound = Math.max(1, current - delta);
    const rightBound = Math.min(total, current + delta);

    // Always include first page
    if (leftBound > 1) {
      pages.push(1);
      if (leftBound > 2) pages.push("...");
    }

    // Add pages around current page
    for (let i = leftBound; i <= rightBound; i++) {
      pages.push(i);
    }

    // Always include last page
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
    // Reset to page 1 when searching
    setPage(1);
    fetchEvents();
  };

  // Toggle filter options
  const toggleFilter = (key) => {
    setFilter((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
    setPage(1); // Reset to page 1 when filter changes
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 md:p-6 space-y-6">
      {/* Hero */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <h1 className="text-3xl md:text-4xl font-bold">Programme</h1>
        <div className="flex items-center space-x-2">
          {isAdmin && (
            <Link href="/events/new">
              <button className="flex items-center px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                <FiPlus className="mr-1" />
                New Event
              </button>
            </Link>
          )}
          <button
            onClick={() => setView("calendar")}
            className={`p-2 rounded ${
              view === "calendar"
                ? "bg-teal-600 text-white"
                : "hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            <FiCalendar size={20} />
          </button>
          <button
            onClick={() => setView("list")}
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
                setPage(1); // Reset to page 1 when scope changes
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
                <label className=" flex items-center space-x-2 mt-2">
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
          <p className="text-center text-gray-500 dark:text-gray-400">
            Calendar view coming soon. Please use the list view for now.
          </p>
          {/* TODO: Implement a calendar component */}
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
                  <p className="text-sm mb-4 line-clamp-3">
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
                  <Link href={`/programme/${event._id}`}>
                    <button className="flex items-center space-x-1 px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 text-sm">
                      <span>Details</span>
                    </button>
                  </Link>
                </div>

                {/* Admin actions */}
                {isAdmin && (
                  <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t dark:border-gray-700">
                    <Link href={`/events/edit?id=${event._id}`}>
                      <button className="flex items-center space-x-1 px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded text-xs">
                        <FiEdit size={14} />
                        <span>Edit</span>
                      </button>
                    </Link>
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
