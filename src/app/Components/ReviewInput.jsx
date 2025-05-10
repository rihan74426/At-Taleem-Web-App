"use client";

import { useForm } from "react-hook-form";
import { useEffect, useRef, useState } from "react";
import imageCompression from "browser-image-compression";
import { FiTrash2, FiEdit2 } from "react-icons/fi";
import Image from "next/image";
import {
  uploadBytesResumable,
  ref,
  getDownloadURL,
  getStorage,
} from "firebase/storage";
import { app } from "@/firebase";
import { useUser } from "@clerk/nextjs";
import ResponseModal from "./ResponseModal";
import { getAuth, signInWithCustomToken } from "firebase/auth";

export default function ReviewInputPage() {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm();
  const [loadingReview, setLoadingReview] = useState(true);
  const [existingReview, setExistingReview] = useState(null);
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [reviewEditing, setReviewEditing] = useState(null);
  const formRef = useRef(null);
  const [modal, setModal] = useState({
    isOpen: false,
    message: "",
    status: "",
  });
  const showModal = (message, status) =>
    setModal({ isOpen: true, message, status });

  const [makePP, setMakePP] = useState(false);

  const showPicture = watch("showPicture");
  const { user, isLoaded } = useUser();
  // fetch this user's review once
  const fetchReview = async () => {
    const res = await fetch("/api/reviews");
    if (res.ok) {
      const { reviews } = await res.json();
      const my = reviews.filter((r) => r.userId === user.id) || null;
      setExistingReview(my.length > 0 ? [...my] : null);
    }
  };
  useEffect(() => {
    if (!isLoaded) return;
    fetchReview();
    setLoadingReview(false);
  }, [isLoaded, user]);

  // when editing, prefill form
  useEffect(() => {
    setValue("name", reviewEditing?.userName);
    setValue("profession", reviewEditing?.profession);
    setValue("review", reviewEditing?.reviewText);
    setValue("showPicture", reviewEditing?.userProfilePic ? "true" : "false");
  }, [reviewEditing]);

  const editHandler = (item) => {
    setEditing(true);
    setReviewEditing(item);
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const compressIfNeeded = async (file) => {
    if (file.size <= 1024 * 1024) return file;
    return await imageCompression(file, {
      maxSizeMB: 1,
      maxWidthOrHeight: 1024,
      useWebWorker: true,
    });
  };
  let firebaseSignedIn = false;

  const ensureFirebaseSignedIn = async () => {
    if (firebaseSignedIn) return;
    const auth = getAuth(app);
    if (!auth.currentUser) {
      const res = await fetch("/api/firebase-token");
      const { token } = await res.json();

      await signInWithCustomToken(auth, token);
    }
    firebaseSignedIn = true;
  };

  const uploadFile = async (file) => {
    await ensureFirebaseSignedIn();

    const storage = getStorage(app);
    const path = `profile-pictures/${Date.now()}_${file.name}`;
    const task = uploadBytesResumable(ref(storage, path), file);
    return new Promise((res, rej) => {
      task.on("state_changed", null, rej, async () => {
        res(await getDownloadURL(task.snapshot.ref));
      });
    });
  };

  const onSubmit = async (data) => {
    if (!user) {
      showModal("অনুগ্রহ করে প্রথমে লগইন করুন।", "error");
      return;
    }
    setUploading(true);

    try {
      let imageUrl = reviewEditing?.userProfilePic || "";

      if (data.showPicture === "true" && data.image?.[0]) {
        let file = data.image[0];
        file = await compressIfNeeded(file);
        if (makePP) {
          const res = await user.setProfileImage({ file });
          imageUrl = res.publicUrl || imageUrl;
        } else {
          imageUrl = await uploadFile(file);
        }
      }

      const payload = {
        reviewId: reviewEditing?._id,
        userId: user.id,
        userName: data.name,
        profession: data.profession,
        reviewText: data.review.trim(),
        userProfilePic: imageUrl || null,
      };

      const method = editing ? "PUT" : "POST";
      const endpoint = editing ? `/api/reviews` : "/api/reviews";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Server error");
      const { review } = res.json();
      showModal(
        "মন্তব্য সফলভাবে জমা হয়েছে! এডমিন কর্তৃক এপ্রুভ করা হলে পেইজে দেখতে পাবেন!",
        "success"
      );
      reset();
      setEditing(false);
      fetchReview();
    } catch (err) {
      console.error(err);
      showModal("কিছু ভুল হয়েছে, আবার চেষ্টা করুন।", "error");
    } finally {
      setUploading(false);
    }
  };

  const deleteReview = async (id) => {
    if (
      user?.id !== existingReview.find((i) => i._id === id).userId &&
      !user?.publicMetadata?.isAdmin
    ) {
      showModal("You are not authorized to delete this review", "error");
      return null;
    }
    if (confirm("Are you sure you want to delete this review?"))
      try {
        const res = await fetch(`/api/reviews`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: user.id,
            reviewId: id,
          }),
        });
        if (res.ok) {
          fetchReview();
          showModal(
            "আপনার মন্তব্যটি ডিলিট হয়ে গেছে! দয়া করে আবার যুক্ত করুন।",
            "success"
          );
        }
      } catch (error) {
        showModal(
          "একটি সমস্যা হয়েছে! দয়া করে একটু পর আবার চেষ্টা করুন",
          "error"
        );
        console.log("Error deleting review", error);
      }
  };

  if (!isLoaded || loadingReview) {
    return <p className="p-8 text-center">লোড হচ্ছে…</p>;
  }

  // read-only view if user has review and not editing
  if ((existingReview && !editing) || user.publicMetadata.isAdmin) {
    return (
      <div className="container">
        {existingReview?.length > 0 &&
          existingReview.map((item) => (
            <div
              key={item._id}
              className="relative flex items-center flex-col md:flex-row bg-white dark:bg-gray-800 border rounded-lg shadow-md overflow-hidden m-5"
            >
              {/* Right: Content */}
              <div className="flex-1 p-4 flex flex-col justify-between">
                {/* Header row */}
                <div className="flex flex-wrap items-center mb-2">
                  <div className="space-y-1 mr-20">
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {item.userName}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      পেশাঃ {item.profession}
                    </p>
                    <div className="text-sm text-gray-500 dark:text-gray-300">
                      পছন্দ করেছেনঃ {item.likes?.length || 0} জন
                    </div>
                  </div>
                  {item.userProfilePic ? (
                    <Image
                      src={item.userProfilePic}
                      alt={item.userName}
                      width={96}
                      height={96}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                      <span className="text-gray-500 dark:text-gray-300">
                        No Photo
                      </span>
                    </div>
                  )}
                  <span
                    className={`p-1 text-sm m-2 ml-20 rounded ${
                      item.status === "approved"
                        ? "bg-green-200 text-green-800"
                        : "bg-yellow-200 text-yellow-800"
                    }`}
                  >
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </span>
                </div>

                {/* Review text */}
                <p className="flex-1 text-gray-700 dark:text-gray-300 italic whitespace-pre-wrap mb-4">
                  {item.reviewText}
                </p>

                {/* Actions */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => editHandler(item)}
                    className="flex items-center px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded"
                  >
                    <FiEdit2 className="mr-1" /> Edit
                  </button>
                  <button
                    onClick={() => deleteReview(item._id)}
                    className="flex items-center px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded"
                  >
                    <FiTrash2 className="mr-1" /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        {user.publicMetadata.isAdmin && (
          <div
            ref={formRef}
            className="max-w-3xl mx-auto p-6 m-5 bg-gray-100 dark:bg-gray-800 rounded shadow"
          >
            <h2 className="text-2xl font-bold mb-6 text-center text-teal-600 dark:text-teal-300">
              {editing
                ? "Edit Your Review"
                : existingReview
                ? "Submit Another Review"
                : "Share Your Review"}
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label className="block mb-1">নাম</label>
                <input
                  {...register("name", { required: true })}
                  className="w-full dark:bg-black p-3 border rounded"
                  disabled={uploading}
                />
                {errors.name && (
                  <span className="text-red-500 text-sm">প্রয়োজন</span>
                )}
              </div>

              <div>
                <label className="block mb-1">পেশা</label>
                <input
                  {...register("profession", { required: true })}
                  className="w-full p-3 dark:bg-black border rounded"
                  disabled={uploading}
                />
                {errors.profession && (
                  <span className="text-red-500 text-sm">প্রয়োজন</span>
                )}
              </div>

              <div>
                <label className="block mb-1">আপনার মন্তব্য</label>
                <textarea
                  {...register("review", { required: true })}
                  className="w-full p-3 dark:bg-black border rounded h-28"
                  disabled={uploading}
                />
                {errors.review && (
                  <span className="text-red-500 text-sm">প্রয়োজন</span>
                )}
              </div>
              {!reviewEditing?.userProfilePic ? (
                <>
                  <div>
                    <label className="block mb-1">ছবি যুক্ত করতে চান?</label>
                    <select
                      {...register("showPicture")}
                      className="w-full p-3 dark:bg-black border rounded"
                      disabled={uploading}
                    >
                      <option value="false">না</option>
                      <option value="true">হ্যাঁ</option>
                    </select>
                  </div>

                  {showPicture === "true" && (
                    <div>
                      <label className="block mb-1">ছবি আপলোড</label>
                      <input
                        type="file"
                        {...register("image")}
                        accept="image/*"
                        className="w-full p-2 rounded-md"
                      />
                      <label className="inline-flex items-center mt-2">
                        <input
                          type="checkbox"
                          checked={makePP}
                          onChange={(e) => setMakePP(e.target.checked)}
                          className="mr-2"
                        />
                        প্রোফাইল পিক হিসেবে সেট করুন
                      </label>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center">
                  <img
                    src={reviewEditing.userProfilePic}
                    alt="User Pic"
                    className="w-32 h-32 object-cover rounded-full"
                  />
                  <button
                    onClick={() => {
                      setReviewEditing({
                        ...reviewEditing,
                        userProfilePic: null,
                      });
                    }}
                    className="bg-red-500 p-2 ml-5 rounded text-white"
                  >
                    Remove This Photo
                  </button>
                </div>
              )}

              <div className="flex">
                <button
                  type=" cancel"
                  onClick={() => {
                    reset();
                    setEditing(false);
                  }}
                  className="w-full m-3 py-3 bg-red-600 text-white rounded disabled:opacity-50"
                >
                  বাতিল করুন
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className=" w-full m-3 py-3 bg-blue-600 text-white rounded disabled:opacity-50"
                >
                  {uploading
                    ? "জমা হচ্ছে…"
                    : editing
                    ? "আপডেট করুন"
                    : "জমা দিন"}
                </button>
              </div>
            </form>
          </div>
        )}
        <ResponseModal
          isOpen={modal.isOpen}
          message={modal.message}
          status={modal.status}
          onClose={() => setModal({ ...modal, isOpen: false })}
        />
      </div>
    );
  }

  // form for new or editing
  return (
    <div className=" w-[40rem] mx-auto p-6 m-5 bg-gray-100 dark:bg-gray-800 rounded shadow">
      <h2 className="text-2xl font-bold mb-6 text-center text-teal-600 dark:text-teal-300">
        {editing
          ? "Edit Your Review"
          : existingReview
          ? "Submit Another Review"
          : "Share Your Review"}
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="block mb-1">নাম</label>
          <input
            {...register("name", { required: true })}
            className="w-full dark:bg-black p-3 border rounded"
            disabled={uploading}
          />
          {errors.name && (
            <span className="text-red-500 text-sm">প্রয়োজন</span>
          )}
        </div>

        <div>
          <label className="block mb-1">পেশা</label>
          <input
            {...register("profession", { required: true })}
            className="w-full p-3 dark:bg-black border rounded"
            disabled={uploading}
          />
          {errors.profession && (
            <span className="text-red-500 text-sm">প্রয়োজন</span>
          )}
        </div>

        <div>
          <label className="block mb-1">আপনার মন্তব্য</label>
          <textarea
            {...register("review", { required: true })}
            className="w-full p-3 dark:bg-black border rounded h-28"
            disabled={uploading}
          />
          {errors.review && (
            <span className="text-red-500 text-sm">প্রয়োজন</span>
          )}
        </div>

        {!reviewEditing?.userProfilePic ? (
          <>
            <div>
              <label className="block mb-1">ছবি যুক্ত করতে চান?</label>
              <select
                {...register("showPicture")}
                className="w-full p-3 dark:bg-black border rounded"
                disabled={uploading}
              >
                <option value="false">না</option>
                <option value="true">হ্যাঁ</option>
              </select>
            </div>

            {showPicture === "true" && (
              <div>
                <label className="block mb-1">ছবি আপলোড</label>
                <input
                  type="file"
                  {...register("image")}
                  accept="image/*"
                  className="w-full p-2 rounded-md"
                />
                <label className="inline-flex items-center mt-2">
                  <input
                    type="checkbox"
                    checked={makePP}
                    onChange={(e) => setMakePP(e.target.checked)}
                    className="mr-2"
                  />
                  প্রোফাইল পিক হিসেবে সেট
                </label>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center">
            <img
              src={reviewEditing.userProfilePic}
              alt="User Pic"
              className="w-32 h-32 object-cover rounded-full"
            />
            <button
              onClick={() => {
                setReviewEditing({
                  ...reviewEditing,
                  userProfilePic: null,
                });
              }}
              className="bg-red-500 p-2 ml-5 rounded text-white"
            >
              Remove This Photo
            </button>
          </div>
        )}

        <div className="flex">
          <button
            type=" cancel"
            onClick={() => {
              reset();
              setEditing(false);
            }}
            className="w-full m-3 py-3 bg-red-600 text-white rounded disabled:opacity-50"
          >
            বাতিল করুন
          </button>
          <button
            type="submit"
            disabled={uploading}
            className=" w-full m-3 py-3 bg-blue-600 text-white rounded disabled:opacity-50"
          >
            {uploading ? "জমা হচ্ছে…" : editing ? "আপডেট করুন" : "জমা দিন"}
          </button>
        </div>
      </form>

      <ResponseModal
        isOpen={modal.isOpen}
        message={modal.message}
        status={modal.status}
        onClose={() => setModal({ ...modal, isOpen: false })}
      />
    </div>
  );
}
