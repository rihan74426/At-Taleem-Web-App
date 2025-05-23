"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  FiCalendar,
  FiClock,
  FiMapPin,
  FiUsers,
  FiBell,
  FiStar,
  FiArrowLeft,
  FiEdit,
  FiTrash2,
  FiCheck,
  FiX,
  FiAlertCircle,
  FiShare2,
  FiDownload,
  FiExternalLink,
  FiUser,
  FiTag,
  FiMessageCircle,
} from "react-icons/fi";
import ResponseModal from "@/app/Components/ResponseModal";
import EventInputModal from "@/app/Components/EventInputModal";
import { FaUserEdit } from "react-icons/fa";

export default function EventDetailsPage() {
  const { user, isLoaded } = useUser();
  const [users, setUsers] = useState([]);
  const params = useParams();
  const router = useRouter();
  const eventId = params.id;
  const isAdmin = user?.publicMetadata?.isAdmin;

  // State management
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userStatus, setUserStatus] = useState({
    interested: false,
    notified: false,
  });
  const [modal, setModal] = useState({
    isOpen: false,
    message: "",
    status: "",
  });
  const [editingEvent, setEditingEvent] = useState(null);
  const [showShareMenu, setShowShareMenu] = useState(false);

  // Show modal helper
  const showModal = (message, status) => {
    setModal({ isOpen: true, message, status });
  };
  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/user", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users.data);
      }
    } catch (error) {
      console.log(error.message);
    }
  };

  // Fetch event details
  const fetchEvent = async () => {
    if (!eventId) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/events/${eventId}`);

      if (!res.ok) {
        if (res.status === 404) {
          setError("Event not found");
        } else {
          throw new Error("Failed to fetch event");
        }
        return;
      }

      const data = await res.json();
      setEvent(data.event);

      // Set user status if user is logged in
      if (isLoaded && user && data.event) {
        setUserStatus({
          interested: data.event.interestedUsers?.includes(user.id) || false,
          notified: data.event.notificationWants?.includes(user.id) || false,
        });
      }
    } catch (err) {
      console.error("Error fetching event:", err);
      setError("Unable to load event details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle user interest toggle
  const handleToggleInterest = async () => {
    if (!isLoaded || !user) {
      showModal("আগ্রহী হওয়ার জন্য দয়া করে আগে লগিন করে নিন!", "error");
      return;
    }

    if (event.canceled) {
      showModal("বাতিল হওয়া মাহফিলে আগ্রহ দেখানো যায় না!", "error");
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
      setEvent(data.event);
      setUserStatus(data.userStatus);

      showModal(
        data.userStatus.interested
          ? "আপনি এখন এই মাহফিলে আগ্রহী!"
          : "আপনি এখন আর এই মাহফিলে আগ্রহী নন!",
        "success"
      );
    } catch (err) {
      console.error("Error toggling interest:", err);
      showModal("আগ্রহ আপডেট করতে সমস্যা হয়েছে!", "error");
    }
  };

  // Handle notification toggle
  const handleToggleNotification = async () => {
    if (!isLoaded || !user) {
      showModal("নোটিফিকেশন পাওয়ার জন্য দয়া করে আগে লগিন করে নিন!", "error");
      return;
    }

    if (event.canceled) {
      showModal("বাতিল হওয়া মাহফিলের নোটিফিকেশন দেওয়া যায় না!", "error");
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
      setEvent(data.event);
      setUserStatus(data.userStatus);

      showModal(
        data.userStatus.notified
          ? "আপনাকে এই মাহফিলের ব্যাপারে ১ ঘন্টা আগে জানানো হবে!"
          : "আপনাকে এই মাহফিলের ব্যাপারে জানানো হবে না!",
        "success"
      );
    } catch (err) {
      console.error("Error toggling notification:", err);
      showModal("নোটিফিকেশন সিস্টেম আপডেট করতে একটু সমস্যা হয়েছে!", "error");
    }
  };

  // Admin actions
  const handleToggleComplete = async () => {
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
      setEvent(data.event);

      showModal(
        `মাহফিল ${
          data.event.completed ? "সম্পন্ন" : "অসম্পন্ন"
        } হিসেবে চিহ্নিত করা হয়েছে`,
        "success"
      );
    } catch (err) {
      console.error("Error updating event status:", err);
      showModal("মাহফিলের অবস্থা আপডেট করতে সমস্যা হয়েছে!", "error");
    }
  };

  const handleToggleCancel = async () => {
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
      setEvent(data.event);

      showModal(
        `মাহফিল ${data.event.canceled ? "বাতিল" : "পুনরুদ্ধার"} করা হয়েছে`,
        "success"
      );
    } catch (err) {
      console.error("Error updating event status:", err);
      showModal("মাহফিলের অবস্থা আপডেট করতে সমস্যা হয়েছে!", "error");
    }
  };

  const handleToggleFeatured = async () => {
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
      setEvent(data.event);

      showModal(
        `মাহফিল ${data.event.featured ? "বিশেষায়িত" : "সাধারণ"} করা হয়েছে`,
        "success"
      );
    } catch (err) {
      console.error("Error updating featured status:", err);
      showModal("মাহফিলকে বিশেষায়িত করতে সমস্যা হয়েছে!", "error");
    }
  };

  const handleDeleteEvent = async () => {
    if (!isAdmin) return;

    if (
      !window.confirm(
        "আপনি কি নিশ্চিত যে এই মাহফিলটি মুছে ফেলতে চান? এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।"
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

      showModal("মাহফিল সফলভাবে মুছে ফেলা হয়েছে!", "success");

      // Redirect to programme page after deletion
      setTimeout(() => {
        router.push("/programme");
      }, 2000);
    } catch (err) {
      console.error("Error deleting event:", err);
      showModal("মাহফিল মুছে ফেলতে সমস্যা হয়েছে!", "error");
    }
  };

  // Share functionality
  const handleShare = async (platform) => {
    const eventUrl = `${window.location.origin}/programme/${eventId}`;
    const shareText = `${event.title} - ${formatDate(event.startDate)}`;

    try {
      switch (platform) {
        case "copy":
          await navigator.clipboard.writeText(eventUrl);
          showModal("লিংক কপি করা হয়েছে!", "success");
          break;
        case "whatsapp":
          window.open(
            `https://wa.me/?text=${encodeURIComponent(
              `${shareText}\n${eventUrl}`
            )}`,
            "_blank"
          );
          break;
        case "facebook":
          window.open(
            `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
              eventUrl
            )}`,
            "_blank"
          );
          break;
        case "twitter":
          window.open(
            `https://twitter.com/intent/tweet?text=${encodeURIComponent(
              shareText
            )}&url=${encodeURIComponent(eventUrl)}`,
            "_blank"
          );
          break;
        default:
          if (navigator.share) {
            await navigator.share({
              title: event.title,
              text: shareText,
              url: eventUrl,
            });
          }
      }
    } catch (err) {
      console.error("Error sharing:", err);
      showModal("শেয়ার করতে সমস্যা হয়েছে!", "error");
    }

    setShowShareMenu(false);
  };

  // Format functions
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("bn-BD", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleTimeString("bn-BD", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getScopeLabel = (scope) => {
    const labels = {
      weekly: "সাপ্তাহিক",
      monthly: "মাসিক",
      yearly: "বার্ষিক",
    };
    return labels[scope] || scope;
  };

  // Calculate days until event
  const getDaysUntilEvent = () => {
    if (!event?.startDate) return null;
    const today = new Date();
    const eventDate = new Date(event.startDate);
    const diffTime = eventDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "অতীত";
    if (diffDays === 0) return "আজ";
    if (diffDays === 1) return "আগামীকাল";
    return `${diffDays} দিন বাকি`;
  };

  // Load event on mount
  useEffect(() => {
    fetchEvent();
    fetchUsers();
  }, [eventId, isLoaded, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            মাহফিলের বিস্তারিত লোড হচ্ছে...
          </p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <FiAlertCircle className="mx-auto h-16 w-16 text-red-500 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {error || "মাহফিল পাওয়া যায়নি"}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              দুঃখিত, আপনার অনুরোধ করা মাহফিলটি খুঁজে পাওয়া যায়নি।
            </p>
            <Link
              href="/programme"
              className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700"
            >
              <FiArrowLeft className="mr-2" />
              সব মাহফিল দেখুন
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push(`${window.location.origin}/programme`)}
              className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            >
              <FiArrowLeft className="mr-2" />
              ফিরে যান
            </button>

            <div className="flex items-center space-x-2">
              {/* Share menu */}
              <div className="relative">
                <button
                  onClick={() => setShowShareMenu(!showShareMenu)}
                  className="flex items-center px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 border rounded"
                >
                  <FiShare2 className="mr-2" />
                  শেয়ার করুন
                </button>

                {showShareMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border rounded-lg shadow-lg z-10">
                    <button
                      onClick={() => handleShare("copy")}
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      লিংক কপি করুন
                    </button>
                    <button
                      onClick={() => handleShare("whatsapp")}
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      WhatsApp এ শেয়ার করুন
                    </button>
                    <button
                      onClick={() => handleShare("facebook")}
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Facebook এ শেয়ার করুন
                    </button>
                    <button
                      onClick={() => handleShare("twitter")}
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Twitter এ শেয়ার করুন
                    </button>
                  </div>
                )}
              </div>

              {/* Admin actions */}
              {isAdmin && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setEditingEvent(event)}
                    className="flex items-center px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    <FiEdit className="mr-2" />
                    ইডিট
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Header */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              {/* Status badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                {event.featured && (
                  <span className="inline-flex items-center px-3 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 text-sm rounded-full">
                    <FiStar className="mr-1" size={16} />
                    বিশেষ মাহফিল
                  </span>
                )}
                {event.completed && (
                  <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-sm rounded-full">
                    <FiCheck className="mr-1" size={16} />
                    সম্পন্ন
                  </span>
                )}
                {event.canceled && (
                  <span className="inline-flex items-center px-3 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-sm rounded-full">
                    <FiX className="mr-1" size={16} />
                    বাতিল
                  </span>
                )}
                <span className="inline-flex items-center px-3 py-1 bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200 text-sm rounded-full">
                  <FiTag className="mr-1" size={16} />
                  {getScopeLabel(event.scope)}
                </span>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                {event.title}
              </h1>

              {/* Key Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <FiCalendar className="mr-3 text-teal-600" size={20} />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {formatDate(event.startDate)}
                    </p>
                    <p className="text-sm">{getDaysUntilEvent()}</p>
                  </div>
                </div>

                {event.scheduledTime && (
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <FiClock className="mr-3 text-teal-600" size={20} />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {formatTime(event.scheduledTime)}
                      </p>
                      <p className="text-sm">নির্ধারিত সময়</p>
                    </div>
                  </div>
                )}

                {event.location && (
                  <div className="flex items-start text-gray-600 dark:text-gray-400 md:col-span-2">
                    <FiMapPin className="mr-3 text-teal-600 mt-1" size={20} />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {event.location}
                      </p>
                      <p className="text-sm">স্থান</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <FiUsers className="mr-3 text-teal-600" size={20} />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {event.interestedUsers?.length || 0} জন
                    </p>
                    <p className="text-sm">আগ্রহী</p>
                  </div>
                </div>
                {event.createdBy && users.length > 0 && (
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <FaUserEdit className="mr-3 text-teal-600" size={20} />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {event.createdBy !== "System Generated"
                          ? (() => {
                              const creator = users.find(
                                (user) => user.id === event.createdBy
                              );
                              return creator
                                ? `${creator.firstName} ${creator.lastName}`
                                : "Admin";
                            })()
                          : "System Generated"}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        কর্তৃক ঘোষিত
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              {event.description && (
                <div className="prose max-w-none text-gray-700 dark:text-gray-300">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    বিস্তারিত বিবরণ
                  </h3>
                  <div className="whitespace-pre-wrap bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    {event.description}
                  </div>
                </div>
              )}
            </div>

            {/* Additional Information */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                অতিরিক্ত তথ্য
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    মাহফিল আইডি
                  </p>
                  <p className="font-mono text-sm">{event._id}</p>
                </div>

                {event.seriesIndex && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      সিরিজ নম্বর
                    </p>
                    <p className="font-medium">{event.seriesIndex}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    তৈরি হয়েছে
                  </p>
                  <p className="font-medium">
                    {new Date(event.createdAt).toLocaleDateString("bn-BD")}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    শেষ আপডেট
                  </p>
                  <p className="font-medium">
                    {new Date(event.updatedAt).toLocaleDateString("bn-BD")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Action Panel */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                কার্যক্রম
              </h3>

              {!event.canceled && !event.completed && (
                <div className="space-y-3">
                  <button
                    onClick={handleToggleInterest}
                    className={`w-full flex items-center justify-center px-4 py-3 rounded-lg font-medium transition-colors ${
                      userStatus.interested
                        ? "bg-teal-600 text-white hover:bg-teal-700"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    <FiStar className="mr-2" />
                    {userStatus.interested ? "আগ্রহী আছি" : "আগ্রহী হন"}
                  </button>

                  <button
                    onClick={handleToggleNotification}
                    className={`w-full flex items-center justify-center px-4 py-3 rounded-lg font-medium transition-colors ${
                      userStatus.notified
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    <FiBell className="mr-2" />
                    {userStatus.notified ? "রিমাইন্ডার চালু" : "রিমাইন্ডার চান"}
                  </button>
                </div>
              )}

              {(event.canceled || event.completed) && (
                <div className="text-center py-4">
                  <p className="text-gray-500 dark:text-gray-400">
                    {event.canceled
                      ? "এই মাহফিলটি বাতিল করা হয়েছে"
                      : "এই মাহফিলটি সম্পন্ন হয়েছে"}
                  </p>
                </div>
              )}

              {/* Admin Actions */}
              {isAdmin && (
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                    অ্যাডমিন কার্যক্রম
                  </h4>
                  <div className="space-y-2">
                    <button
                      onClick={handleToggleComplete}
                      className="w-full flex items-center px-3 py-2 text-sm bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded hover:bg-green-200 dark:hover:bg-green-800"
                    >
                      <FiCheck className="mr-2" />
                      {event.completed ? "অসম্পন্ন করুন" : "সম্পন্ন করুন"}
                    </button>

                    <button
                      onClick={handleToggleCancel}
                      className="w-full flex items-center px-3 py-2 text-sm bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded hover:bg-red-200 dark:hover:bg-red-800"
                    >
                      <FiAlertCircle className="mr-2" />
                      {event.canceled ? "পুনরুদ্ধার করুন" : "বাতিল করুন"}
                    </button>

                    <button
                      onClick={handleToggleFeatured}
                      className="w-full flex items-center px-3 py-2 text-sm bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded hover:bg-yellow-200 dark:hover:bg-yellow-800"
                    >
                      <FiStar className="mr-2" />
                      {event.featured ? "সাধারণ করুন" : "বিশেষায়িত করুন"}
                    </button>

                    <button
                      onClick={handleDeleteEvent}
                      className="w-full flex items-center px-3 py-2 text-sm bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded hover:bg-red-200 dark:hover:bg-red-800"
                    >
                      <FiTrash2 className="mr-2" />
                      মাহফিল ডিলিট করুন
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Interested People */}
            {event.interestedUsers && event.interestedUsers.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  আগ্রহী ব্যক্তিবর্গ ({event.interestedUsers.length} জন)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {event.interestedUsers.slice(0, 12).map((userId, index) => (
                    <div
                      key={userId}
                      className="flex items-center p-2 bg-gray-50 dark:bg-gray-700 rounded"
                    >
                      <FiUser className="mr-2 text-teal-600" />
                      <span className="text-sm">ব্যবহারকারী {index + 1}</span>
                    </div>
                  ))}
                  {event.interestedUsers.length > 12 && (
                    <div className="flex items-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        আরও {event.interestedUsers.length - 12} জন...
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Event Statistics */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                পরিসংখ্যান
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-teal-600">
                    {event.interestedUsers?.length || 0}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    আগ্রহী
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {event.notificationWants?.length || 0}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    নোটিফিকেশন
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {event.seriesIndex || 1}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    সিরিজ নম্বর
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {getDaysUntilEvent()}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    দিন বাকি
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                দ্রুত কার্যক্রম
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <a
                  href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
                    event.title
                  )}&dates=${new Date(event.startDate)
                    .toISOString()
                    .replace(/[-:]/g, "")
                    .replace(/\.\d{3}/, "")}&details=${encodeURIComponent(
                    event.description || ""
                  )}&location=${encodeURIComponent(event.location || "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center px-4 py-2 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded hover:bg-red-200 dark:hover:bg-red-800"
                >
                  <FiCalendar className="mr-2" />
                  Google Calendar এ যোগ করুন
                </a>

                <button
                  onClick={() => {
                    const eventData = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//At-Taleem//Event//EN
BEGIN:VEVENT
UID:${event._id}@taleembd.com
DTSTAMP:${new Date()
                      .toISOString()
                      .replace(/[-:]/g, "")
                      .replace(/\.\d{3}/, "")}
DTSTART:${new Date(event.startDate)
                      .toISOString()
                      .replace(/[-:]/g, "")
                      .replace(/\.\d{3}/, "")}
SUMMARY:${event.title}
DESCRIPTION:${event.description || ""}
LOCATION:${event.location || ""}
END:VEVENT
END:VCALENDAR`;

                    const blob = new Blob([eventData], {
                      type: "text/calendar",
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${event.title}.ics`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="flex items-center justify-center px-4 py-2 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded hover:bg-blue-200 dark:hover:bg-blue-800"
                >
                  <FiDownload className="mr-2" />
                  Calendar ফাইল ডাউনলোড
                </button>

                <button
                  onClick={() => {
                    const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      event.location || ""
                    )}`;
                    window.open(mapUrl, "_blank");
                  }}
                  disabled={!event.location}
                  className="flex items-center justify-center px-4 py-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded hover:bg-green-200 dark:hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiMapPin className="mr-2" />
                  Maps এ দেখুন
                </button>

                <Link
                  href="/programme"
                  className="flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  <FiExternalLink className="mr-2" />
                  সব মাহফিল দেখুন
                </Link>
              </div>
            </div>

            {/* Comments/Discussion Section (if needed) */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                আলোচনা
              </h3>
              <div className="flex items-center justify-center py-8 text-gray-500 dark:text-gray-400">
                <FiMessageCircle className="mr-2" size={24} />
                <span>এই বৈশিষ্ট্যটি শীঘ্রই আসছে...</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {editingEvent && (
        <EventInputModal
          event={editingEvent}
          onClose={() => setEditingEvent(null)}
          onEventUpdate={(updatedEvent) => {
            setEvent(updatedEvent);
            setEditingEvent(null);
            showModal("মাহফিল সফলভাবে আপডেট করা হয়েছে!", "success");
          }}
        />
      )}

      <ResponseModal
        isOpen={modal.isOpen}
        message={modal.message}
        status={modal.status}
        onClose={() => setModal({ ...modal, isOpen: false })}
      />

      {/* Click outside to close share menu */}
      {showShareMenu && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowShareMenu(false)}
        />
      )}
    </div>
  );
}
