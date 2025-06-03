import { useForm } from "react-hook-form";
import { z } from "zod";
import { useUser } from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";

export default function MasalahForm({ initialData, onSubmit, isAdmin }) {
  const { user } = useUser();
  const [categories, setCategories] = useState([]); // All available categories
  const [categoryInput, setCategoryInput] = useState("");
  const [masalahCategories, setMasalahCategories] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);

  const {
    register,
    reset,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: initialData || {
      title: "",
      description: "",
      references: "",
      categories: [],
    },
  });

  // Fetch all categories
  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories);
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Update suggestions when categoryInput, categories, or masalahCategories change
  useEffect(() => {
    const input = categoryInput.trim().toLowerCase();
    const filtered = categories.filter(
      (cat) =>
        cat.name.toLowerCase().includes(input) &&
        !masalahCategories.some((mc) => mc._id === cat._id)
    );
    setSuggestions(filtered);
  }, [categoryInput, categories, masalahCategories]);

  // Handlers for input focus and blur
  const handleFocus = () => {
    setShowSuggestions(true);
  };

  const handleBlur = () => {
    setTimeout(() => setShowSuggestions(false), 100);
  };

  const handleChange = (e) => {
    setCategoryInput(e.target.value);
  };

  // Handle selecting an existing category
  const handleSelect = (cat) => {
    if (!masalahCategories.some((c) => c._id === cat._id)) {
      const updated = [...masalahCategories, cat];
      setMasalahCategories(updated);
    }
    setCategoryInput("");
    setShowSuggestions(false);
  };

  // Create a new category if none match the input and select it
  const handleAddNewCategory = async () => {
    if (!user?.publicMetadata?.isAdmin) {
      alert("You have to be an Admin to add new categories");
      return;
    }

    if (!categoryInput.trim()) return;
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: categoryInput.trim() }),
      });
      if (res.ok) {
        const newCat = await res.json();
        setCategories((prev) => [...prev, newCat]);
        setMasalahCategories((prev) => [...prev, newCat]);
        setCategoryInput("");
        setShowSuggestions(false);
      }
    } catch (err) {
      console.error("Error adding new category:", err);
    }
  };

  // Remove a category from the masalah
  const removeCategory = (catId) => {
    setMasalahCategories((prev) => prev.filter((cat) => cat._id !== catId));
  };

  const handleFormSubmit = (data) => {
    // Add the selected categories to the form data
    const formData = {
      ...data,
      categories: masalahCategories.map((cat) => cat._id),
    };
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Title
        </label>
        <input
          type="text"
          id="title"
          {...register("title")}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
          placeholder="Enter the title of the Islamic issue"
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Description
        </label>
        <textarea
          id="description"
          rows={4}
          {...register("description")}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
          placeholder="Provide a detailed description of the Islamic issue"
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">
            {errors.description.message}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="references"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          References
        </label>
        <textarea
          id="references"
          rows={3}
          {...register("references")}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
          placeholder="Enter Quran and Hadith references"
        />
        {errors.references && (
          <p className="mt-1 text-sm text-red-600">
            {errors.references.message}
          </p>
        )}
      </div>

      {/* Category Section */}
      <div className="mb-4 relative">
        <label className="block mb-1 text-sm font-semibold text-gray-700 dark:text-gray-300">
          Assign Categories:
        </label>
        <div className="flex flex-wrap gap-2">
          {masalahCategories.map((cat) => (
            <div
              key={cat._id}
              className="flex items-center gap-1 bg-slate-700 text-blue-200 px-2 py-1 rounded hover:bg-red-500 hover:cursor-pointer"
              onClick={() => removeCategory(cat._id)}
              title="Click to remove"
            >
              <span>{cat.name}</span>
              <span className="text-red-600">&times;</span>
            </div>
          ))}
        </div>
        <input
          ref={inputRef}
          type="text"
          placeholder="Add a category..."
          value={categoryInput}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className="w-full border p-2 rounded mt-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
        {showSuggestions && (
          <div className="absolute top-full left-0 right-0 border rounded bg-white dark:bg-gray-800 mt-1 z-10 max-h-48 overflow-auto">
            {suggestions.length > 0 ? (
              suggestions.map((cat) => (
                <div
                  key={cat._id}
                  onMouseDown={() => handleSelect(cat)}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"
                >
                  {cat.name}
                </div>
              ))
            ) : (
              <div
                onMouseDown={handleAddNewCategory}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"
              >
                Add "{categoryInput}" as a new category
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={() => reset()}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!isAdmin || isSubmitting}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Saving..." : initialData ? "Update" : "Create"}
        </button>
      </div>
    </form>
  );
}
