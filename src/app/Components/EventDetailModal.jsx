import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import {
  FiBell,
  FiCalendar,
  FiStar,
  FiMap,
  FiEdit,
  FiTrash2,
  FiAlertCircle,
  FiX,
  FiCheck,
  FiUsers,
  FiShare2,
  FiExternalLink,
} from "react-icons/fi";

export default function EventDetailModal({
  event,
  onClose,
  onEventUpdate,
  onEventDelete,
}) {
  const { user, isLoaded } = useUser();
  const isAdmin = user?.publicMetadata?.isAdmin;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userStatus, setUserStatus] = useState({
    interested: false,
    notified: false,
  });

  // Format dates for display
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
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

  // Fetch user status on mount
  useEffect(() => {
    if (isLoaded && user && event) {
      setUserStatus({
        interested: event.interestedUsers?.includes(user.id) || false,
        notified: event.notificationWants?.includes(user.id) || false,
      });
    }
  }, [isLoaded, user, event]);

  // Handle event interest toggle
  const handleToggleInterest = async () => {
    if (!isLoaded || !user) {
      setError("Please sign in to express interest");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/events/${event._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggleInterest" }),
      });

      if (!res.ok) {
        throw new Error("Failed to update interest");
      }

      const data = await res.json();

      // Update local state for immediate feedback
      setUserStatus((prev) => ({
        ...prev,
        interested: data.userStatus.interested,
      }));

      // Update the parent component
      if (onEventUpdate) {
        onEventUpdate(data.event);
      }
    } catch (err) {
      console.error("Error toggling interest:", err);
      setError("Failed to update interest");
    } finally {
      setLoading(false);
    }
  };

  // Handle notification toggle for specific event
  const handleToggleNotification = async () => {
    if (!isLoaded || !user) {
      setError("Please sign in to receive notifications");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/events/${event._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggleNotification" }),
      });

      if (!res.ok) {
        throw new Error("Failed to update notification preferences");
      }

      const data = await res.json();

      // Update local state for immediate feedback
      setUserStatus((prev) => ({
        ...prev,
        notified: data.userStatus.notified,
      }));

      // Update the parent component
      if (onEventUpdate) {
        onEventUpdate(data.event);
      }
    } catch (err) {
      console.error("Error toggling notification:", err);
      setError("Failed to update notification preferences");
    } finally {
      setLoading(false);
    }
  };

  // Admin functions
  const handleToggleComplete = async () => {
    if (!isAdmin) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/events/${event._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggleComplete" }),
      });

      if (!res.ok) {
        throw new Error("Failed to update event status");
      }

      const data = await res.json();

      // Update the parent component
      if (onEventUpdate) {
        onEventUpdate(data.event);
      }
    } catch (err) {
      console.error("Error updating event status:", err);
      setError("Failed to update event status");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCancel = async () => {
    if (!isAdmin) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/events/${event._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggleCancel" }),
      });

      if (!res.ok) {
        throw new Error("Failed to update event status");
      }

      const data = await res.json();

      // Update the parent component
      if (onEventUpdate) {
        onEventUpdate(data.event);
      }
    } catch (err) {
      console.error("Error updating event status:", err);
      setError("Failed to update event status");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFeatured = async () => {
    if (!isAdmin) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/events/${event._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggleFeatured" }),
      });

      if (!res.ok) {
        throw new Error("Failed to update featured status");
      }

      const data = await res.json();

      // Update the parent component
      if (onEventUpdate) {
        onEventUpdate(data.event);
      }
    } catch (err) {
      console.error("Error updating featured status:", err);
      setError("Failed to update featured status");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!isAdmin) return;

    if (
      !window.confirm(
        "Are you sure you want to delete this event? This action cannot be undone."
      )
    ) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/events/${event._id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete event");
      }

      // Notify parent component
      if (onEventDelete) {
        onEventDelete(event._id);
      }

      // Close the modal
      onClose();
    } catch (err) {
      console.error("Error deleting event:", err);
      setError("Failed to delete event");
    } finally {
      setLoading(false);
    }
  };

  // Share event
  const shareEvent = () => {
    if (navigator.share) {
      navigator
        .share({
          title: event.title,
          text: `Check out this event: ${event.title}`,
          url: `${window.location.origin}/programme/${event._id}`,
        })
        .catch((error) => console.log("Error sharing:", error));
    } else {
      // Fallback - copy link to clipboard
      const url = `${window.location.origin}/programme/${event._id}`;
      navigator.clipboard.writeText(url);
      alert("Link copied to clipboard!");
    }
  };

  if (!event) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 p-4 border-b dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-bold">{event.title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <FiX size={24} />
          </button>
        </div>

        <div className="p-6">
          {/* Status indicators */}
          <div className="flex flex-wrap gap-2 mb-4">
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
          <div className="space-y-4 mb-6">
            <div className="flex items-center text-gray-600 dark:text-gray-400">
              <FiCalendar className="mr-2" />
              <div>
                <p>{formatDate(event.startDate)}</p>
                {event.scheduledTime && (
                  <p className="text-sm">{formatTime(event.scheduledTime)}</p>
                )}
              </div>
            </div>

            {event.location && (
              <div className="flex items-center text-gray-600 dark:text-gray-400">
                <FiMap className="mr-2" />
                <span>{event.location}</span>
              </div>
            )}

            {event.interestedUsers?.length > 0 && (
              <div className="flex items-center text-gray-600 dark:text-gray-400">
                <FiUsers className="mr-2" />
                <span>{event.interestedUsers.length} interested</span>
              </div>
            )}

            {event.description && (
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h3 className="font-medium mb-2">About this event</h3>
                <p className="whitespace-pre-line">{event.description}</p>
              </div>
            )}

            {event.additionalInfo && (
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Additional Information</h3>
                <p className="whitespace-pre-line">{event.additionalInfo}</p>
              </div>
            )}
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200 rounded">
              {error}
            </div>
          )}

          {/* User actions */}
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleToggleInterest}
                disabled={loading || event.canceled}
                className={`flex items-center space-x-2 px-4 py-2 rounded ${
                  userStatus.interested
                    ? "bg-teal-600 text-white"
                    : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                } ${
                  loading || event.canceled
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              >
                <FiStar size={18} />
                <span>{userStatus.interested ? "Interested" : "Interest"}</span>
              </button>

              <button
                onClick={handleToggleNotification}
                disabled={loading || event.canceled}
                className={`flex items-center space-x-2 px-4 py-2 rounded ${
                  userStatus.notified
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                } ${
                  loading || event.canceled
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              >
                <FiBell size={18} />
                <span>{userStatus.notified ? "Notifying" : "Notify Me"}</span>
              </button>

              <button
                onClick={shareEvent}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded"
              >
                <FiShare2 size={18} />
                <span>Share</span>
              </button>

              <Link href={`/programme/${event._id}`} target="blank">
                <button className="flex items-center space-x-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded">
                  <FiExternalLink size={18} />
                  <span>Full Page</span>
                </button>
              </Link>
            </div>

            {/* Admin actions */}
            {isAdmin && (
              <div className="pt-4 border-t dark:border-gray-700">
                <h3 className="text-sm font-medium mb-3 text-gray-500 dark:text-gray-400">
                  Admin Actions
                </h3>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/events/edit/${event._id}`}>
                    <button className="flex items-center space-x-1 px-3 py-2 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded">
                      <FiEdit size={16} />
                      <span>Edit</span>
                    </button>
                  </Link>

                  <button
                    onClick={handleToggleComplete}
                    disabled={loading}
                    className="flex items-center space-x-1 px-3 py-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded"
                  >
                    <FiCheck size={16} />
                    <span>
                      {event.completed ? "Mark Incomplete" : "Complete"}
                    </span>
                  </button>

                  <button
                    onClick={handleToggleCancel}
                    disabled={loading}
                    className="flex items-center space-x-1 px-3 py-2 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded"
                  >
                    <FiAlertCircle size={16} />
                    <span>{event.canceled ? "Restore" : "Cancel"}</span>
                  </button>

                  <button
                    onClick={handleToggleFeatured}
                    disabled={loading}
                    className="flex items-center space-x-1 px-3 py-2 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded"
                  >
                    <FiStar size={16} />
                    <span>{event.featured ? "Unfeature" : "Feature"}</span>
                  </button>

                  <button
                    onClick={handleDeleteEvent}
                    disabled={loading}
                    className="flex items-center space-x-1 px-3 py-2 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded"
                  >
                    <FiTrash2 size={16} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-70 dark:bg-gray-800 dark:bg-opacity-70 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
          </div>
        )}
      </div>
    </div>
  );
}
