"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useUser } from "@clerk/nextjs";
import ResponseModal from "./ResponseModal";
import Loader from "./Loader";

const Editor = dynamic(() => import("./Editor"), { ssr: false });

export default function Homepage() {
  const { user } = useUser();
  const [data, setData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [modal, setModal] = useState({
    isOpen: false,
    message: "",
    status: "",
  });

  const showModal = (message, status) => {
    setModal({ isOpen: true, message, status });
  };

  const rqustUrl = "/api/homepage/get";

  useEffect(() => {
    fetch(rqustUrl)
      .then((res) => res.json())
      .then((content) => setData(content));
  }, []);

  const handleUpdate = async (updatedContent) => {
    if (!user?.publicMetadata?.isAdmin) {
      modal.isOpen = true;
      showModal(
        "You have to be an Admin to change anything restricted",
        "error"
      );
    } else {
      const res = await fetch(rqustUrl, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedContent),
      });
      setData(updatedContent);
      setIsEditing(false);
      if (res.ok) {
        showModal("Successfully Updated Greetings!", "success");
      } else {
        showModal("Failed to Update Greetings! Please try again...", "error");
        console.error("Error Updating");
      }
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="relative ">
        <h2 className="font-bold text-center text-4xl text-gray-900 dark:text-white">
          Welcome to the At-Taleem's Official Webpage. (Greetings)
        </h2>
        <h5 className="mt-4 text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
          Hello! This is a Short introduction and the greeting section of the
          page
        </h5>
      </div>

      {data ? (
        <div className="relative bg-white dark:bg-gray-900 shadow-md p-6 rounded-lg ">
          {isEditing ? (
            <Editor
              initialData={data}
              onSave={handleUpdate}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            <>
              <div className="relative flex place-content-center">
                <h3 className="bg-black text-center p-2 rounded">
                  Web Notice Section
                </h3>
              </div>
              <div className="flex justify-end mb-2">
                <button
                  className="bg-blue-600 dark:bg-green-500 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm transition-all"
                  onClick={() => setIsEditing(true)}
                >
                  Edit
                </button>
              </div>
              <h1 className="font-bold text-center text-2xl ">
                {data.greeting}
              </h1>
              <div
                className="mt-4 text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: data.description }}
              />
            </>
          )}
        </div>
      ) : (
        <div className="flex place-content-center text-gray-500">
          <Loader />
        </div>
      )}

      {/* Website Under Construction Message */}
      <div className="bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 p-4 rounded-lg shadow-md text-center">
        <h2 className="text-2xl font-semibold">🚧 Under Construction 🚧</h2>
        <p className="mt-2 text-gray-600 dark:text-gray-200">
          Thank you for visiting us! Please sign up on the right side above.
          We'll notify you via email once the website is ready.
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
