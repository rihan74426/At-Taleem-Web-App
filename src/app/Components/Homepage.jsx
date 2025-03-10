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
    <div className="p-6 max-w-4xl mx-auto anek-bangla-font">
      {data ? (
        <div className="relative">
          {isEditing ? (
            <Editor
              initialData={data}
              onSave={handleUpdate}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            <>
              <h1 className=" font-bold text-center text-4xl">
                {data.greeting}
              </h1>
              <div
                className="mt-4 dark:text-gray-200 "
                dangerouslySetInnerHTML={{ __html: data.description }}
              />
              {user?.publicMetadata?.isAdmin && (
                <button
                  className=" place-self-end list-item rounded-md dark:text-white 0 bg-blend-color dark:bg-black p-1"
                  onClick={() => setIsEditing(true)}
                >
                  Edit
                </button>
              )}
            </>
          )}
        </div>
      ) : (
        <p>Loading...</p>
      )}

      <div className="justify-center mt-4">
        <h2 className="text-2xl font-bold text-red-500 text-center">
          Construction of this website is in progress!...
        </h2>
        <p>
          Thank you for your Visiing us. Please Sign up on the account page.
          We'll send you an email once the website is ready
        </p>
      </div>
    </div>
  );
}
