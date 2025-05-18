import { useState, useEffect, useMemo } from "react";
import {
  FiChevronLeft,
  FiChevronRight,
  FiCalendar,
  FiClock,
  FiMapPin,
  FiStar,
  FiCheck,
  FiX,
  FiAlertCircle,
  FiBell,
} from "react-icons/fi";

const CalendarView = ({
  events,
  scope,
  userStatus,
  handleToggleInterest,
  handleToggleNotification,
  handleSetViewingEvent,
  isAdmin,
  handleToggleComplete,
  handleToggleCancel,
  handleToggleFeatured,
  handleDeleteEvent,
  setEditingEvent,
}) => {
  // State for current view date
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  // Update current date when scope changes
  useEffect(() => {
    setCurrentDate(new Date());
    setSelectedDate(null);
  }, [scope]);

  // Format date utilities
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

  // Get 30 dates for the view starting from the current date or start of month
  const viewDates = useMemo(() => {
    const dates = [];
    const now = new Date(currentDate);

    // Determine the start date based on the scope
    let startDate;
    if (scope === "monthly") {
      // Start from the 1st of the current month
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (scope === "yearly") {
      // For yearly view, we'll still show 30 days but starting from current date
      startDate = new Date(now);
    } else {
      // Default (weekly or any other) - start from today
      startDate = new Date(now);
    }

    // Create array of 30 days
    for (let i = 0; i < 30; i++) {
      const nextDate = new Date(startDate);
      nextDate.setDate(startDate.getDate() + i);
      dates.push(nextDate);
    }

    return dates;
  }, [currentDate, scope]);

  // Get events for specific date
  const getEventsForDate = (date) => {
    if (!events || !events.length) return [];

    return events.filter((event) => {
      const eventDate = new Date(event.startDate);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  };

  // Get all dates that have events for highlighting
  const eventDates = useMemo(() => {
    if (!events || !events.length) return [];

    const dates = {};
    events.forEach((event) => {
      const eventDate = new Date(event.startDate);
      const dateKey = `${eventDate.getFullYear()}-${eventDate.getMonth()}-${eventDate.getDate()}`;
      dates[dateKey] = true;
    });

    return dates;
  }, [events]);

  // Check if a date has events
  const hasEvents = (date) => {
    const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    return !!eventDates[dateKey];
  };

  // Navigation functions
  const navigatePrevious = () => {
    const newDate = new Date(currentDate);
    if (scope === "monthly") {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      // For all other views, go back 30 days
      newDate.setDate(newDate.getDate() - 30);
    }
    setCurrentDate(newDate);
    setSelectedDate(null);
  };

  const navigateNext = () => {
    const newDate = new Date(currentDate);
    if (scope === "monthly") {
      newDate.setMonth(newDate.getMonth() + 1);
    } else {
      // For all other views, go forward 30 days
      newDate.setDate(newDate.getDate() + 30);
    }
    setCurrentDate(newDate);
    setSelectedDate(null);
  };

  const navigateToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(null);
  };

  // Get current period label
  const getPeriodLabel = () => {
    const firstDay = new Date(viewDates[0]);
    const lastDay = new Date(viewDates[viewDates.length - 1]);

    if (scope === "monthly") {
      return currentDate.toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
      });
    } else {
      return `${formatDate(firstDay)} - ${formatDate(lastDay)}`;
    }
  };

  // Check if a date is the current date
  const isToday = (date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Check if date is in the current month
  const isCurrentMonth = (date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  // Get CSS class for date cell
  const getDateCellClass = (date) => {
    let classes =
      "h-full min-h-12 p-1 border border-gray-200 dark:border-gray-700 ";

    if (isToday(date)) {
      classes += "bg-blue-50 dark:bg-blue-900/20 ";
    }

    if (hasEvents(date)) {
      classes += "bg-teal-50 dark:bg-teal-900/10 ";
    }

    if (!isCurrentMonth(date)) {
      classes +=
        "bg-gray-100 dark:bg-gray-800/50 text-gray-400 dark:text-gray-500 ";
    }

    if (
      selectedDate &&
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    ) {
      classes += "ring-2 ring-inset ring-teal-500 ";
    }

    return classes;
  };

  // Event dot indicator colors
  const getEventDotColor = (event) => {
    if (event.canceled) return "bg-red-500";
    if (event.completed) return "bg-green-500";
    if (event.featured) return "bg-yellow-500";
    return "bg-teal-500";
  };

  // Group dates by week for grid display
  const weekRows = useMemo(() => {
    const rows = [];
    let currentRow = [];

    viewDates.forEach((date, index) => {
      currentRow.push(date);

      // Create a new row after every 7 days or at the end
      if ((index + 1) % 7 === 0 || index === viewDates.length - 1) {
        rows.push([...currentRow]);
        currentRow = [];
      }
    });

    return rows;
  }, [viewDates]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      {/* Calendar Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={navigatePrevious}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <FiChevronLeft />
          </button>
          <h2 className="text-lg font-semibold">{getPeriodLabel()}</h2>
          <button
            onClick={navigateNext}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <FiChevronRight />
          </button>
        </div>
        <button
          onClick={navigateToday}
          className="px-3 py-1 bg-teal-600 text-white text-sm rounded hover:bg-teal-700"
        >
          Today
        </button>
      </div>

      {/* Calendar Grid - Always displayed as a grid regardless of scope */}
      <div>
        <div className="grid grid-cols-7 min-h-96">
          {/* Week day headers */}
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="text-center p-2 font-medium border-b border-gray-200 dark:border-gray-700"
            >
              {day}
            </div>
          ))}

          {/* Calendar days by week rows */}
          {weekRows.map((week, weekIndex) =>
            week.map((date, dateIndex) => (
              <div
                key={`${weekIndex}-${dateIndex}`}
                className={getDateCellClass(date)}
                onClick={() => setSelectedDate(date)}
              >
                <div className="flex justify-between items-start">
                  <span
                    className={`inline-block w-6 h-6 rounded-full text-center ${
                      isToday(date) ? "bg-teal-600 text-white" : ""
                    }`}
                  >
                    {date.getDate()}
                  </span>

                  {/* Month label for the first day of month */}
                  {date.getDate() === 1 && (
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      {date.toLocaleDateString(undefined, { month: "short" })}
                    </span>
                  )}

                  {/* Event indicators */}
                  <div className="flex space-x-1">
                    {getEventsForDate(date)
                      .slice(0, 3)
                      .map((event) => (
                        <div
                          key={event._id}
                          className={`w-2 h-2 rounded-full ${getEventDotColor(
                            event
                          )}`}
                          title={event.title}
                        ></div>
                      ))}
                    {getEventsForDate(date).length > 3 && (
                      <span className="text-xs">
                        +{getEventsForDate(date).length - 3}
                      </span>
                    )}
                  </div>
                </div>

                {/* Event preview - show 1-2 events based on available space */}
                {getEventsForDate(date).length > 0 && (
                  <div className="mt-1">
                    <div
                      className={`text-xs truncate px-1 py-0.5 rounded ${
                        getEventsForDate(date)[0].canceled
                          ? "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300"
                          : getEventsForDate(date)[0].completed
                          ? "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300"
                          : getEventsForDate(date)[0].featured
                          ? "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300"
                          : "bg-teal-100 dark:bg-teal-900/20 text-teal-800 dark:text-teal-300"
                      }`}
                      title={getEventsForDate(date)[0].title}
                    >
                      {getEventsForDate(date)[0].scheduledTime &&
                        `${formatTime(
                          getEventsForDate(date)[0].scheduledTime
                        )} `}
                      {getEventsForDate(date)[0].title}
                    </div>
                    {getEventsForDate(date).length > 1 && (
                      <div className="text-xs mt-1 text-gray-500 dark:text-gray-400">
                        +{getEventsForDate(date).length - 1} more
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Event Detail Panel - Shows when a date is selected */}
      {selectedDate && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">{formatDate(selectedDate)}</h3>
            <button
              onClick={() => setSelectedDate(null)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <FiX />
            </button>
          </div>

          {getEventsForDate(selectedDate).length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              No events scheduled for this date
            </p>
          ) : (
            <div className="space-y-3">
              {getEventsForDate(selectedDate).map((event) => (
                <div
                  key={event._id}
                  className={`p-3 rounded-lg border ${
                    event.canceled
                      ? "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20"
                      : event.completed
                      ? "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20"
                      : event.featured
                      ? "border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20"
                      : "border-gray-200 dark:border-gray-700"
                  }`}
                >
                  <div className="flex flex-wrap gap-2 mb-2">
                    {event.featured && (
                      <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 text-xs rounded-full flex items-center">
                        <FiStar className="mr-1" /> Featured
                      </span>
                    )}
                    {event.completed && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs rounded-full flex items-center">
                        <FiCheck className="mr-1" /> Completed
                      </span>
                    )}
                    {event.canceled && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-xs rounded-full flex items-center">
                        <FiX className="mr-1" /> Canceled
                      </span>
                    )}
                  </div>

                  <h4 className="font-medium">{event.title}</h4>

                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
                    <FiCalendar className="mr-1" />
                    <span>{formatDate(event.startDate)}</span>
                    {event.scheduledTime && (
                      <>
                        <FiClock className="ml-3 mr-1" />
                        <span>{formatTime(event.scheduledTime)}</span>
                      </>
                    )}
                  </div>

                  {event.location && (
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
                      <FiMapPin className="mr-1" />
                      <span>{event.location}</span>
                    </div>
                  )}

                  {event.description && (
                    <p className="text-sm mt-2 line-clamp-2 whitespace-pre-wrap">
                      {event.description}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700 flex flex-wrap gap-2">
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
                      onClick={() => handleSetViewingEvent(event)}
                      className="flex items-center space-x-1 px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 text-sm"
                    >
                      <span>Details</span>
                    </button>

                    {isAdmin && (
                      <>
                        <button
                          onClick={() => setEditingEvent(event)}
                          className="flex items-center space-x-1 px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded text-xs"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => handleToggleComplete(event._id)}
                          className="flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded text-xs"
                        >
                          {event.completed ? "Mark Incomplete" : "Complete"}
                        </button>

                        <button
                          onClick={() => handleToggleCancel(event._id)}
                          className="flex items-center space-x-1 px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded text-xs"
                        >
                          {event.canceled ? "Restore" : "Cancel"}
                        </button>

                        <button
                          onClick={() => handleToggleFeatured(event._id)}
                          className="flex items-center space-x-1 px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded text-xs"
                        >
                          {event.featured ? "Unfeature" : "Feature"}
                        </button>

                        <button
                          onClick={() => handleDeleteEvent(event._id)}
                          className="flex items-center space-x-1 px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded text-xs"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CalendarView;
