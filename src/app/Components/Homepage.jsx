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
    <div className="space-y-12 min-h-screen">
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
            href="/questionnaires"
            className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
          >
            প্রশ্ন করুন
          </a>
          <a
            href="/taleem-videos"
            className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
          >
            ভিডিও দেখুন
          </a>
          <a
            href="/published-books"
            className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
          >
            বই পড়ুন
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
        {data ? (
          <div className="max-w-5xl justify-self-center items-center text-center border p-10 rounded">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white p-5">
              Web Notice Section
            </h2>
            {isEditing ? (
              <Editor
                initialData={data}
                onSave={handleUpdate}
                onCancel={() => setIsEditing(false)}
              />
            ) : (
              <>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap p-3">
                  {data.greeting}
                </p>
                <div
                  className="text-gray-600 dark:text-gray-400 prose max-w-none p-3"
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
            )}
          </div>
        ) : (
          <div className="justify-self-center ">
            <Loader />
          </div>
        )}
      </main>

      {/* Under Construction Banner */}
      <div className="bg-red-100 border dark:bg-red-900 text-red-600 w-2/3 justify-self-center dark:text-red-300 p-4 rounded-lg shadow-md text-center">
        <h2 className="text-2xl font-semibold">🚧 Under Construction 🚧</h2>
        <p className="mt-2 text-gray-600 dark:text-gray-200">
          Thank you for visiting us! Please sign up by your gmail or facebook in
          one tap. We'll notify you via email once the website will be ready to
          launch.
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
