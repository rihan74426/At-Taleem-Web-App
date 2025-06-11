"use client";
import { useState, useEffect, memo } from "react";
import dynamic from "next/dynamic";
import { SignInButton, useUser } from "@clerk/nextjs";
import ResponseModal from "./ResponseModal";
import { motion, AnimatePresence } from "framer-motion";
import { FaEdit, FaClock, FaBook, FaVideo, FaQuestion } from "react-icons/fa";
import { formatDistanceToNow } from "date-fns";
import { bn } from "date-fns/locale";

// Dynamically import Editor with loading state
const Editor = dynamic(() => import("./Editor"), {
  ssr: false,
  loading: () => (
    <div className="animate-pulse">
      <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
    </div>
  ),
});

// Memoized LinkButton component
const LinkButton = memo(function LinkButton({ href, children, icon: Icon }) {
  return (
    <motion.a
      href={href}
      className="px-6 py-3 bg-white text-blue-700 rounded-lg font-semibold hover:bg-gray-100 transition flex items-center gap-2 shadow-lg hover:shadow-xl"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {Icon && <Icon className="text-lg" />}
      {children}
    </motion.a>
  );
});

// Memoized NoticeSection component
const NoticeSection = memo(function NoticeSection({
  data,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  isAdmin,
}) {
  if (!data) {
    return (
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
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      {isEditing ? (
        <Editor initialData={data} onSave={onSave} onCancel={onCancel} />
      ) : (
        <>
          <div className="flex flex-col mb-6">
            <h3 className="text-3xl place-content-center text-center font-bold text-gray-900 dark:text-white mb-2">
              নোটিশ
            </h3>
            {data.updatedAt && (
              <div className="flex flex-wrap items-center gap-2 text-sm place-content-end text-gray-500 dark:text-gray-400">
                <FaClock className="text-blue-500" />
                <span>
                  {formatDistanceToNow(new Date(data.updatedAt), {
                    addSuffix: true,
                    locale: bn,
                  })}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-xl text-center">
              {data.greeting}
            </p>
            <div
              className="prose dark:prose-invert max-w-none text-lg text-center"
              dangerouslySetInnerHTML={{ __html: data.description }}
            />
          </div>

          {isAdmin && (
            <div className="flex justify-center mt-8">
              <button
                onClick={onEdit}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-lg hover:shadow-xl"
              >
                <FaEdit />
                Edit Content
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
});

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
    const fetchData = async () => {
      try {
        const res = await fetch("/api/homepage/get");
        const data = await res.json();
        setData(data);
      } catch (error) {
        console.error("Error fetching homepage data:", error);
        showModal("Failed to load content", "error");
      }
    };
    fetchData();
  }, []);

  const showModal = (message, status) =>
    setModal({ isOpen: true, message, status });

  const handleUpdate = async (updated) => {
    if (!user?.publicMetadata?.isAdmin) {
      return showModal(
        "You have to be an admin first to change anything restricted",
        "error"
      );
    }

    try {
      const res = await fetch("/api/homepage/get", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });

      if (res.ok) {
        setData(updated);
        setIsEditing(false);
        showModal("Updated successfully!", "success");
      } else {
        throw new Error("Update failed");
      }
    } catch (error) {
      console.error("Error updating content:", error);
      showModal("Update failed", "error");
    }
  };

  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <motion.div
        className="min-h-screen bg-gradient-to-br from-blue-700 to-teal-500 dark:from-gray-950 dark:to-blue-900 flex flex-col justify-center items-center text-center text-white px-4"
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
          className="mt-6 max-w-xl text-lg md:text-xl text-justify leading-relaxed"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1 }}
        >
          সরাসরি কুরআন হাদিস থেকে দ্বীনকে অনুধাবন করার জগতে আপনাকে স্বাগতম।
          এখানে রয়েছে রেকর্ডেড তালিম ও জুমার ভিডিও এবং নিজেদের সমস্যার ব্যাপারে
          সহজেই প্রশ্ন করা ও উত্তর সরাসরি মেইলে পাওয়ার ব্যবস্থা, আরও রয়েছে
          ফ্রিতেই আমাদের বই পড়ার সুযোগ। তাছাড়া আছে তালিমের নিয়মিত অনিয়মিত সকল
          প্রোগ্রামের নোটিফিকেশন ব্যবস্থা।
        </motion.p>
        <motion.div
          className="mt-10 flex flex-wrap justify-center gap-4"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          <LinkButton href="/questionnaires" icon={FaQuestion}>
            প্রশ্ন করুন
          </LinkButton>
          <LinkButton href="/taleem-videos" icon={FaVideo}>
            ভিডিও দেখুন
          </LinkButton>
          <LinkButton href="/published-books" icon={FaBook}>
            বই পড়ুন
          </LinkButton>
          {!isSignedIn && (
            <SignInButton mode="modal">
              <motion.button
                className="px-6 py-3 border-2 border-white rounded-lg hover:bg-white hover:text-blue-700 transition shadow-lg hover:shadow-xl"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Sign In
              </motion.button>
            </SignInButton>
          )}
        </motion.div>
      </motion.div>

      {/* Under Construction Banner */}
      <AnimatePresence>
        <motion.div
          className="bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 p-6 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <h2 className="text-2xl font-semibold">🚧 Under Construction 🚧</h2>
          <p>Sign up to get notified when we launch!</p>
        </motion.div>
      </AnimatePresence>

      {/* Notice Section */}
      <section className="py-16 px-6 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto">
          <NoticeSection
            data={data}
            isEditing={isEditing}
            onEdit={() => setIsEditing(true)}
            onSave={handleUpdate}
            onCancel={() => setIsEditing(false)}
            isAdmin={user?.publicMetadata?.isAdmin}
          />
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
