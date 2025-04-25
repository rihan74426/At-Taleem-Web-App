"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { SignInButton, useUser } from "@clerk/nextjs";
import ResponseModal from "./ResponseModal";
import Loader from "./Loader";

const Editor = dynamic(() => import("./Editor"), { ssr: false });

export default function Homepage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [data, setData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [modal, setModal] = useState({
    isOpen: false,
    message: "",
    status: "",
  });

  useEffect(() => {
    fetch("/api/homepage/get")
      .then((res) => res.json())
      .then(setData)
      .catch(console.error);
  }, []);

  const showModal = (message, status) =>
    setModal({ isOpen: true, message, status });

  const handleUpdate = async (updatedContent) => {
    if (!user?.publicMetadata?.isAdmin) {
      return showModal("Admin access required", "error");
    }
    const res = await fetch("/api/homepage/get", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedContent),
    });
    if (res.ok) {
      setData(updatedContent);
      setIsEditing(false);
      showModal("Homepage updated successfully", "success");
    } else {
      showModal("Update failed, try again.", "error");
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <header className="relative bg-gradient-to-r from-blue-600 to-teal-400 text-white py-20 px-6 text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold mb-4">
          At-Taleem Official
        </h1>
        <p className="max-w-xl mx-auto text-lg md:text-xl">
          সরাসরি কুরআন হাদিস থেকে দ্বীনকে অনুধাবন করার জগতে আপনাকে স্বাগতম।
          এখানে রয়েছে রেকর্ডেড তালিম ও জুমার ভিডিও এবং নিজেদের সমস্যার ব্যাপারে
          সহজেই প্রশ্ন করা ও উত্তর সরাসরি মেইলে পাওয়ার ব্যবস্থা, আরও রয়েছে
          ফ্রিতেই আমাদের বই পড়ার সুযোগ। তাছাড়া আছে তালিমের নিয়মিত অনিয়মিত সকল
          প্রোগ্রামের নোটিফিকেশন ব্যবস্থা।
        </p>

        <div className="mt-8 flex justify-center gap-4">
          <a
            href="#features"
            className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
          >
            Explore Features
          </a>
          {!isSignedIn && (
            <div className="bg-transparent border border-white px-6 py-3 rounded-lg hover:bg-white hover:text-blue-600 transition">
              <SignInButton mode="modal" />
            </div>
          )}
        </div>
        <div className="absolute inset-x-0 bottom-0">
          <svg
            viewBox="0 0 1440 100"
            className="w-full h-20 fill-current text-white"
          >
            <path d="M0,0 C360,100 1080,0 1440,100 L1440,100 L0,100 Z" />
          </svg>
        </div>
      </header>

      {/* Content Section */}
      <main
        className="flex-grow bg-white dark:bg-gray-900 py-16 px-6"
        id="features"
      >
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Web Notice Section
            </h2>
            {data ? (
              isEditing ? (
                <Editor
                  initialData={data}
                  onSave={handleUpdate}
                  onCancel={() => setIsEditing(false)}
                />
              ) : (
                <>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {data.greeting}
                  </p>
                  <div
                    className="text-gray-600 dark:text-gray-400 prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: data.description }}
                  />
                  {user?.publicMetadata?.isAdmin && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                    >
                      Edit Content
                    </button>
                  )}
                </>
              )
            ) : (
              <Loader />
            )}
          </div>
        </div>
      </main>

      {/* Under Construction Banner */}
      <div className="bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 p-6 text-center">
        <h3 className="text-2xl font-semibold">🚧 Under Construction 🚧</h3>
        <p className="mt-2">
          Stay tuned! Sign up to get notified when we launch.
        </p>
      </div>

      <ResponseModal
        isOpen={modal.isOpen}
        message={modal.message}
        status={modal.status}
        onClose={() => setModal({ ...modal, isOpen: false })}
      />
    </div>
  );
}
