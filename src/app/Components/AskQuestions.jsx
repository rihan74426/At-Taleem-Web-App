"use client";
import { useState } from "react";
import { useUser } from "@clerk/nextjs";

export default function AskQuestionForm({
  onQuestionSubmitted,
  initialQuestion = null,
}) {
  const { user, isSignedIn } = useUser();
  const [title, setTitle] = useState(initialQuestion?.title || "");
  const [description, setDescription] = useState(
    initialQuestion?.description || ""
  );
  // For logged-in users, allow a checkbox to ask anonymously.
  const [anonymous, setAnonymous] = useState(
    initialQuestion?.anonymous || false
  );
  // For anonymous questions (or if user is not logged in), ask for name and email.
  const [name, setName] = useState(initialQuestion?.username || "");
  const [email, setEmail] = useState(initialQuestion?.email || "");

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prepare question data:
    let questionData = { title, description };
    if (isSignedIn && !anonymous) {
      // Use logged-in user's profile (you can adjust these fields based on your Clerk configuration)
      questionData.userId = user?.id;
      questionData.username = user?.fullName;
      questionData.email = user?.primaryEmailAddress?.emailAddress;
      questionData.isAnonymous = false;
    } else {
      // For non-logged in or if anonymous is checked
      questionData.username = name.trim() || "Anonymous";
      questionData.email = email.trim();
      questionData.isAnonymous = true;
    }

    const method = initialQuestion ? "PATCH" : "POST";
    const url = initialQuestion
      ? `/api/questions/${initialQuestion._id}`
      : "/api/questions";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(questionData),
    });

    if (res.ok) {
      const newQuestion = await res.json();
      // Notify parent component, if provided
      if (onQuestionSubmitted) onQuestionSubmitted(newQuestion);
      // Reset form (or optionally, keep the values for editing)
      setTitle("");
      setDescription("");
      setAnonymous(false);
      setName("");
      setEmail("");
    } else {
      console.error("Error submitting question");
      // Optionally, display error feedback here
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4 ">
      <h1 className="text-2xl font-bold mb-4">
        {initialQuestion ? "Edit Your Question" : "Add a Question"}
      </h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {!isSignedIn && (
          <div className="space-y-2">
            {!anonymous && (
              <input
                type="text"
                placeholder="Your Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border p-2 rounded dark:bg-black"
                required
              />
            )}
            <input
              type="email"
              placeholder="উত্তর পাঠানোর জন্য একটি ই-মেইল দিন"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border p-2 rounded dark:bg-black"
              required
            />
          </div>
        )}
        <input
          type="text"
          placeholder="প্রশ্নটি লিখুন..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border p-2 rounded dark:bg-black"
          required
        />
        <textarea
          placeholder="বিস্তারিত বর্ণনা থাকলে লিখুন..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border p-2 rounded dark:bg-black"
        />

        <div className="flex items-center gap-2">
          <label htmlFor="anonymous">অজ্ঞাতনামা?</label>
          <input
            id="anonymous"
            type="checkbox"
            checked={anonymous}
            onChange={(e) => setAnonymous(e.target.checked)}
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 rounded"
        >
          {initialQuestion ? "Update Question" : "Submit Question"}
        </button>
      </form>
    </div>
  );
}
