"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { SignInButton, useUser } from "@clerk/nextjs";
import ResponseModal from "./ResponseModal";
import Loader from "./Loader";
import { motion } from "framer-motion";

const Editor = dynamic(() => import("./Editor"), { ssr: false });

export default function Homepage() {
  const { user, isSignedIn } = useUser();
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
  const handleUpdate = async (updated) => {
    if (!user?.publicMetadata?.isAdmin)
      return showModal(
        "You have to be an admin first to change anything restricted",
        "error"
      );
    const res = await fetch("/api/homepage/get", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
    if (res.ok) {
      setData(updated);
      setIsEditing(false);
      showModal("Updated!", "success");
    } else showModal("Update failed", "error");
  };

  return (
    <div className="flex flex-col w-full place-content-center">
      {/* Full‑width Animated Hero */}
      <motion.div
        className="h-screen bg-gradient-to-br from-blue-700 to-teal-500 dark:from-gray-950 dark:to-blue-900 flex flex-col justify-center items-center text-center text-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <motion.h1
          className="text-5xl md:text-7xl font-extrabold drop-shadow-lg"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, type: "spring" }}
        >
          At‑Taleem Official
        </motion.h1>
        <motion.p
          className="mt-6 max-w-xl px-4 text-lg md:text-xl text-justify"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1 }}
        >
          সরাসরি কুরআন হাদিস থেকে দ্বীনকে অনুধাবন করার জগতে আপনাকে স্বাগতম।
          এখানে রয়েছে রেকর্ডেড তালিম ও জুমার ভিডিও এবং নিজেদের সমস্যার ব্যাপারে
          সহজেই প্রশ্ন করা ও উত্তর সরাসরি মেইলে পাওয়ার ব্যবস্থা, আরও রয়েছে
          ফ্রিতেই আমাদের বই পড়ার সুযোগ। তাছাড়া আছে তালিমের নিয়মিত অনিয়মিত সকল
          প্রোগ্রামের নোটিফিকেশন ব্যবস্থা।{" "}
        </motion.p>
        <motion.div
          className="mt-10 flex flex-wrap justify-center gap-4"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          <LinkButton href="/questionnaires">প্রশ্ন করুন</LinkButton>
          <LinkButton href="/taleem-videos">ভিডিও দেখুন</LinkButton>
          <LinkButton href="/published-books">বই পড়ুন</LinkButton>
          {!isSignedIn && (
            <SignInButton mode="modal">
              <button className="px-6 py-3 border-2 border-white rounded-lg hover:bg-white hover:text-blue-700 transition">
                Sign In
              </button>
            </SignInButton>
          )}
        </motion.div>
      </motion.div>

      {/* Under Construction */}
      <div className="bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 p-6 text-center">
        <h2 className="text-2xl font-semibold">🚧 Under Construction 🚧</h2>
        <p>Sign up to get notified when we launch!</p>
      </div>

      {/* Notice Section */}
      <section className="py-16 px-6 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-3xl font-bold mb-4">Web Notice Section</h3>
          {data ? (
            isEditing ? (
              <Editor
                initialData={data}
                onSave={handleUpdate}
                onCancel={() => setIsEditing(false)}
              />
            ) : (
              <>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap mb-6">
                  {data.greeting}
                </p>
                <div
                  className="prose dark:prose-invert max-w-none mb-6"
                  dangerouslySetInnerHTML={{ __html: data.description }}
                />
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Edit Content
                </button>
              </>
            )
          ) : (
            <div className="flex flex-col items-center gap-4 animate-pulse">
              <div className="h-6 w-1/2 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-4 w-1/3 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
              <div className="w-full max-w-3xl">
                <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                </div>
              </div>
              <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded mt-6"></div>
            </div>
          )}
        </div>
      </section>

      <ResponseModal
        isOpen={modal.isOpen}
        message={modal.message}
        status={modal.status}
        onClose={() => setModal({ ...modal, isOpen: false })}
      />
    </div>
  );
}

function LinkButton({ href, children }) {
  return (
    <motion.a
      href={href}
      className="px-6 py-3 bg-white text-blue-700 rounded-lg font-semibold hover:bg-gray-100 transition"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {children}
    </motion.a>
  );
}
