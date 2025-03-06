"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useUser } from "@clerk/nextjs";

const Editor = dynamic(() => import("./Editor"), { ssr: false });

export default function Homepage() {
  const { user, isSignedIn } = useUser();

  const [data, setData] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false); // Replace with real admin check
  const [isEditing, setIsEditing] = useState(false);

  const rqustUrl = "/api/homepage/get";
  useEffect(() => {
    setIsAdmin(isSignedIn && user.publicMetadata.isAdmin);
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
    <div className="p-6 max-w-4xl mx-auto">
      {data ? (
        <div
          className="relative"
          onMouseEnter={() => isAdmin && setIsEditing(true)}
        >
          {isEditing ? (
            <Editor
              initialData={data}
              onSave={handleUpdate}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            <>
              <h1 className="text-3xl font-bold">{data.greeting}</h1>
              <div
                className="mt-4 text-gray-700"
                dangerouslySetInnerHTML={{ __html: data.description }}
              />
              {isAdmin && (
                <button
                  className="absolute top-0 right-0 text-blue-500"
                  onClick={() => setIsEditing(true)}
                >
                  ✏️ Edit
                </button>
              )}
            </>
          )}
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}
