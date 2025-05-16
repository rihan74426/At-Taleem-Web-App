"use client";

import { useForm } from "react-hook-form";

const SCOPES = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

const defaultValues = {
  title: "",
  description: "",
  scope: "weekly",
  startDate: "",
  scheduledTime: "",
  seriesIndex: 1,
  location: "",
  featured: false,
};

export default function EventForm({ initialData, onSubmit, isAdmin }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: initialData
      ? { ...defaultValues, ...initialData }
      : defaultValues,
  });

  return (
    <div className="space-y-4">
      <div>
        <label className="block font-semibold">Title*</label>
        <input
          {...register("title", { required: "Title is required" })}
          className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
        />
        {errors.title && (
          <p className="text-red-500 text-sm">{errors.title.message}</p>
        )}
      </div>

      <div>
        <label className="block font-semibold">Description</label>
        <textarea
          {...register("description")}
          className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
          rows={4}
        />
      </div>

      <div>
        <label className="block font-semibold">Scope*</label>
        <select
          {...register("scope", { required: "Scope is required" })}
          className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
        >
          {SCOPES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        {errors.scope && (
          <p className="text-red-500 text-sm">{errors.scope.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block font-semibold">Start Date*</label>
          <input
            type="date"
            {...register("startDate", { required: "Start date is required" })}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
          />
          {errors.startDate && (
            <p className="text-red-500 text-sm">{errors.startDate.message}</p>
          )}
        </div>
        <div>
          <label className="block font-semibold">Scheduled Time</label>
          <input
            type="datetime-local"
            {...register("scheduledTime")}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      <div>
        <label className="block font-semibold">Location</label>
        <input
          {...register("location")}
          className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
          placeholder="Optional location"
        />
      </div>

      <div>
        <label className="block font-semibold">Series Index</label>
        <input
          type="number"
          min="1"
          {...register("seriesIndex", {
            valueAsNumber: true,
            min: { value: 1, message: "Series index must be at least 1" },
          })}
          className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
        />
        {errors.seriesIndex && (
          <p className="text-red-500 text-sm">{errors.seriesIndex.message}</p>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="featured"
          {...register("featured")}
          className="h-5 w-5 text-blue-600"
        />
        <label htmlFor="featured" className="font-semibold">
          Featured Event
        </label>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={() => {
            reset(defaultValues);
          }}
          className="w-full py-3 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit(onSubmit)}
          disabled={!isAdmin}
          className={`w-full py-2 rounded text-white ${
            isAdmin
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          {initialData ? "Update Event" : "Create Event"}
        </button>
      </div>

      {!isAdmin && (
        <p className="text-amber-500 text-sm text-center">
          Only administrators can create or edit events.
        </p>
      )}
    </div>
  );
}
