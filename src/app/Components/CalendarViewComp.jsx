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
  onMonthChange, // New prop to handle month changes
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

  const isToday = (date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Get only the current month's dates (no padding from other months)
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Always start from the first day of the month
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    // Get the day of week for the first day (0 = Sunday, 6 = Saturday)
    const firstDayWeekday = firstDayOfMonth.getDay();
    // Total days in current month
    const totalDaysInMonth = lastDayOfMonth.getDate();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayWeekday; i++) {
      days.push(null);
    }

    // Add all days of the current month
    for (let day = 1; day <= totalDaysInMonth; day++) {
      const date = new Date(year, month, day);
      days.push({
        date,
        isCurrentMonth: true,
        isToday: isToday(date),
      });
    }

    return days;
  }, [currentDate]);

  // Group calendar days into weeks (but only show weeks that have current month days)
  const calendarWeeks = useMemo(() => {
    const weeks = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      const week = calendarDays.slice(i, i + 7);
      // Only add weeks that have at least one day from current month
      if (week.some((day) => day !== null)) {
        // Fill the rest of the week with nulls if needed
        while (week.length < 7) {
          week.push(null);
        }
        weeks.push(week);
      }
    }
    return weeks;
  }, [calendarDays]);

  // Filter events to only show current month events
  const currentMonthEvents = useMemo(() => {
    if (!events || !events.length) return [];

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    return events.filter((event) => {
      const eventDate = new Date(event.startDate);
      return eventDate.getFullYear() === year && eventDate.getMonth() === month;
    });
  }, [events, currentDate]);

  // Get events for specific date (only current month events)
  const getEventsForDate = (date) => {
    if (!currentMonthEvents || !currentMonthEvents.length) return [];

    return currentMonthEvents.filter((event) => {
      const eventDate = new Date(event.startDate);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  };

  // Get all dates that have events for highlighting (only current month)
  const eventDates = useMemo(() => {
    if (!currentMonthEvents || !currentMonthEvents.length) return {};

    const dates = {};
    currentMonthEvents.forEach((event) => {
      const eventDate = new Date(event.startDate);
      const dateKey = `${eventDate.getFullYear()}-${eventDate.getMonth()}-${eventDate.getDate()}`;
      dates[dateKey] = true;
    });

    return dates;
  }, [currentMonthEvents]);

  // Check if a date has events
  const hasEvents = (date) => {
    const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    return !!eventDates[dateKey];
  };

  // Navigation functions
  const navigatePrevious = () => {
    const newDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - 1,
      1
    );
    setCurrentDate(newDate);
    setSelectedDate(null);
    onMonthChange?.(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      1
    );
    setCurrentDate(newDate);
    setSelectedDate(null);
    onMonthChange?.(newDate);
  };

  const navigateToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(null);

    // Notify parent to fetch new events for current month
    if (onMonthChange) {
      onMonthChange(today);
    }
  };

  // Get current month label
  const getMonthLabel = () => {
    return currentDate.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
    });
  };

  // Get CSS class for date cell
  const getDateCellClass = (dayInfo) => {
    if (!dayInfo) return "h-20 border border-gray-200 dark:border-gray-700"; // Empty cell

    const { date, isCurrentMonth } = dayInfo;

    let classes =
      "h-20 p-2 border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ";

    if (isToday(date)) {
      classes += "bg-blue-50 dark:bg-blue-900/20 ";
    }

    if (hasEvents(date)) {
      classes += "bg-teal-50 dark:bg-teal-900/10 ";
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

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      {/* Calendar Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={navigatePrevious}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            aria-label="Previous month"
          >
            <FiChevronLeft />
          </button>
          <h2 className="text-lg font-semibold">{getMonthLabel()}</h2>
          <button
            onClick={navigateNext}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            aria-label="Next month"
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

      {/* Show message if no events in current month */}
      {currentMonthEvents.length === 0 && (
        <div className="p-6 text-center bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            Haven't scheduled any events for {getMonthLabel()} yet
          </p>
        </div>
      )}

      {/* Calendar Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-full">
          {/* Week day headers */}
          <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="text-center p-3 font-medium text-sm bg-gray-50 dark:bg-gray-900"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days by week rows */}
          <div className="grid grid-cols-1">
            {calendarWeeks.map((week, weekIndex) => (
              <div key={weekIndex} className="grid grid-cols-7">
                {week.map((dayInfo, dayIndex) => (
                  <div
                    key={`${weekIndex}-${dayIndex}`}
                    className={getDateCellClass(dayInfo)}
                    onClick={() => dayInfo && setSelectedDate(dayInfo.date)}
                  >
                    {dayInfo && (
                      <>
                        <div className="flex justify-between items-start mb-1">
                          <span
                            className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-sm font-medium ${
                              dayInfo.isToday
                                ? "bg-teal-600 text-white"
                                : "text-gray-900 dark:text-gray-100"
                            }`}
                          >
                            {dayInfo.date.getDate()}
                          </span>

                          {/* Event indicators */}
                          <div className="flex space-x-1">
                            {getEventsForDate(dayInfo.date)
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
                            {getEventsForDate(dayInfo.date).length > 3 && (
                              <span className="text-xs text-gray-500">
                                +{getEventsForDate(dayInfo.date).length - 3}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Event preview - show first event */}
                        {getEventsForDate(dayInfo.date).length > 0 ? (
                          <div className="space-y-1">
                            <div
                              className={`text-xs truncate px-1 py-0.5 rounded ${
                                getEventsForDate(dayInfo.date)[0].canceled
                                  ? "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300"
                                  : getEventsForDate(dayInfo.date)[0].completed
                                  ? "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300"
                                  : getEventsForDate(dayInfo.date)[0].featured
                                  ? "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300"
                                  : "bg-teal-100 dark:bg-teal-900/20 text-teal-800 dark:text-teal-300"
                              }`}
                              title={getEventsForDate(dayInfo.date)[0].title}
                            >
                              {getEventsForDate(dayInfo.date)[0]
                                .scheduledTime &&
                                `${formatTime(
                                  getEventsForDate(dayInfo.date)[0]
                                    .scheduledTime
                                )} `}
                              {getEventsForDate(dayInfo.date)[0].title}
                            </div>
                            {getEventsForDate(dayInfo.date).length > 1 && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 px-1">
                                +{getEventsForDate(dayInfo.date).length - 1}{" "}
                                more
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-500 dark:text-gray-400 px-1">
                            {(() => {
                              const today = new Date();
                              today.setHours(0, 0, 0, 0);
                              const currentDay = new Date(dayInfo.date);
                              currentDay.setHours(0, 0, 0, 0);

                              // Check if day is in future
                              if (currentDay > today) {
                                return "এইদিনের জন্য এখনো কোন কর্মসূচী ঘোষিত হয়নি";
                              }
                              // Check if day is in past
                              else if (currentDay < today) {
                                return "কোন কর্মসূচী নেই";
                              }
                              // For today (if no events)
                              else {
                                return "আজকের জন্য কোন কর্মসূচী নেই";
                              }
                            })()}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
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
