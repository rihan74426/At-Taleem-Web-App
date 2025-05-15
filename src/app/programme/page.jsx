// src/app/activities/page.jsx
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FiBell,
  FiCalendar,
  FiList,
  FiChevronLeft,
  FiChevronRight,
  FiFilter,
  FiCheck,
} from "react-icons/fi";
import { Menu } from "@headlessui/react";

const SCOPES = ["weekly", "monthly", "yearly"];

export default function ActivitiesPage() {
  const [view, setView] = useState("calendar"); // or "list"
  const [scope, setScope] = useState("weekly");
  const [prefs, setPrefs] = useState({
    weekly: false,
    monthly: false,
    yearly: false,
  });

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/events?scope=${scope}`);
      if (!res.ok) throw new Error("Failed to load");
      const { activities } = await res.json();
      setActivities(activities);
    } catch (err) {
      console.error(err);
      setError("Unable to fetch activities.");
    } finally {
      setLoading(false);
    }
  }, [scope]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const togglePref = (s) => setPrefs((p) => ({ ...p, [s]: !p[s] }));

  const handleNotify = async (id) => {
    try {
      const res = await fetch(`/api/events/${id}`, {
        method: "PATCH",
      });
      if (!res.ok) throw new Error();
      // Optionally refresh or show toast
      alert("You’ll be notified!");
    } catch {
      alert("Notify failed");
    }
  };

  const handleRSVP = async (id) => {
    try {
      const res = await fetch(`/api/activities/${id}`, {
        method: "POST",
      });
      if (!res.ok) throw new Error();
      alert("RSVP recorded!");
    } catch {
      alert("RSVP failed");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6 space-y-8">
      {/* Hero */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <h1 className="text-4xl font-bold">Upcoming Activities</h1>
        <div className="flex items-center space-x-2">
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
              key={s}
              onClick={() => setScope(s)}
              className={`px-4 py-2 rounded-full ${
                scope === s
                  ? "bg-teal-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              {s[0].toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex space-x-2 items-center">
          <input
            type="text"
            placeholder="Search…"
            className="px-3 py-2 border rounded dark:bg-gray-800"
          />
          <Menu as="div" className="relative">
            <Menu.Button className="flex items-center px-3 py-2 border rounded dark:bg-gray-800">
              <FiFilter className="mr-1" />
              Filters
            </Menu.Button>
            <Menu.Items className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border rounded shadow-lg focus:outline-none z-10">
              <div className="p-2">
                <p className="text-sm font-medium">Example filter</p>
                <label className="inline-flex items-center space-x-2 mt-1">
                  <input type="checkbox" className="form-checkbox" />
                  <span>Option A</span>
                </label>
                <label className="inline-flex items-center space-x-2 mt-1">
                  <input type="checkbox" className="form-checkbox" />
                  <span>Option B</span>
                </label>
              </div>
            </Menu.Items>
          </Menu>
        </div>
      </div>

      {/* Preferences */}
      <div className="flex flex-wrap gap-4 items-center">
        <span className="font-medium">Notify me about:</span>
        {SCOPES.map((s) => (
          <label key={s} className="inline-flex items-center space-x-2">
            <input
              type="checkbox"
              checked={prefs[s]}
              onChange={() => togglePref(s)}
              className="form-checkbox h-5 w-5 text-teal-600"
            />
            <span>{s[0].toUpperCase() + s.slice(1)}</span>
          </label>
        ))}
      </div>

      {/* Data / Loading / Error */}
      {loading ? (
        <p className="text-center">Loading…</p>
      ) : error ? (
        <p className="text-center text-red-500">{error}</p>
      ) : activities.length === 0 ? (
        <p className="text-center">No activities found.</p>
      ) : view === "calendar" ? (
        <div className="p-10 border rounded text-center text-gray-500 dark:text-gray-400">
          {/* TODO: plug in your calendar component here */}
          Calendar view coming soon…
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {activities.map((act) => (
            <div
              key={act.id}
              className="bg-white dark:bg-gray-800 border rounded-lg p-6 flex flex-col justify-between shadow hover:shadow-lg transition"
            >
              <h2 className="text-xl font-semibold mb-2">{act.title}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {new Date(act.date).toLocaleDateString()} ·{" "}
                {act.scope[0].toUpperCase() + act.scope.slice(1)}
              </p>
              <div className="mt-auto flex flex-wrap gap-3">
                <button
                  onClick={() => handleNotify(act.id)}
                  className="flex items-center space-x-1 px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  <FiBell />
                  <span>Notify</span>
                </button>
                <button
                  onClick={() => handleRSVP(act.id)}
                  className="flex items-center space-x-1 px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  <FiCheck />
                  <span>RSVP</span>
                </button>
                <button className="flex items-center space-x-1 px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600">
                  <span>Share</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      <nav className="flex justify-center space-x-2">
        <button className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600">
          <FiChevronLeft />
        </button>
        {[1, 2, 3, 4].map((n) => (
          <button
            key={n}
            className={`px-3 py-1 rounded ${
              n === 1
                ? "bg-teal-600 text-white"
                : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
            }`}
          >
            {n}
          </button>
        ))}
        <button className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600">
          <FiChevronRight />
        </button>
      </nav>
    </div>
  );
}
