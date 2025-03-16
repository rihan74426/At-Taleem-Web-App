"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useUser } from "@clerk/nextjs";

const Editor = dynamic(() => import("./Editor"), { ssr: false });

export default function Homepage() {
  const { user } = useUser();
  const [data, setData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const rqustUrl = "/api/homepage/get";

  useEffect(() => {
    fetch(rqustUrl)
      .then((res) => res.json())
      .then((content) => setData(content));
  }, []);

  const handleUpdate = async (updatedContent) => {
    await fetch(rqustUrl, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedContent),
    });
    setData(updatedContent);
    setIsEditing(false);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
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
              {/* Edit Button (Aligned Right) */}
              {user?.publicMetadata?.isAdmin && (
                <div className="flex justify-end mb-2">
                  <button
                    className="bg-blue-600 dark:bg-green-500 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm transition-all"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit
                  </button>
                </div>
              )}

              <h1 className="font-bold text-center text-4xl text-gray-900 dark:text-white">
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
        <p className="text-center text-gray-500">Loading...</p>
      )}

      {/* Website Under Construction Message */}
      <div className="bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 p-4 rounded-lg shadow-md text-center">
        <h2 className="text-2xl font-semibold">🚧 Under Construction 🚧</h2>
        <p className="mt-2 text-gray-600 dark:text-gray-200">
          Thank you for visiting us! Please sign up on the right side above.
          We'll notify you via email once the website is ready.
        </p>
      </div>
    </div>
  );
}
