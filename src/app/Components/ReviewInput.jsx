"use client";

import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import imageCompression from "browser-image-compression";
import {
  uploadBytesResumable,
  ref,
  getDownloadURL,
  getStorage,
} from "firebase/storage";
import { app } from "@/firebase";
import { useUser } from "@clerk/nextjs";
import ResponseModal from "./ResponseModal";

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
  const [modal, setModal] = useState({
    isOpen: false,
    message: "",
    status: "",
  });
  const [makePP, setMakePP] = useState(false);

  const showPicture = watch("showPicture");
  const { user, isLoaded } = useUser();

  const showModal = (message, status) =>
    setModal({ isOpen: true, message, status });

  // fetch this user's review once
  const fetchReview = async () => {
    const res = await fetch("/api/reviews");
    if (res.ok) {
      const { reviews } = await res.json();
      const my = reviews.filter((r) => r.userId === user.id) || null;
      setExistingReview([...my]);
    }
  };
  useEffect(() => {
    if (!isLoaded) return;
    fetchReview();
    setLoadingReview(false);
  }, [isLoaded, user]);

  // when editing, prefill form
  useEffect(() => {
    if (editing && existingReview) {
      setValue("name", reviewEditing.userName);
      setValue("profession", reviewEditing.profession);
      setValue("review", reviewEditing.reviewText);
      setValue("showPicture", reviewEditing.userProfilePic ? "true" : "false");
    }
    console.log(existingReview);
  }, [editing, existingReview, setValue]);

  const compressIfNeeded = async (file) => {
    if (file.size <= 1024 * 1024) return file;
    return await imageCompression(file, {
      maxSizeMB: 1,
      maxWidthOrHeight: 1024,
      useWebWorker: true,
    });
  };

  const uploadFile = async (file) => {
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
        reviewId: reviewEditing._id,
        userId: user.id,
        userName: data.name,
        profession: data.profession,
        reviewText: data.review,
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
      showModal("মন্তব্য সফলভাবে জমা হয়েছে!", "success");
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

  if (!isLoaded || loadingReview) {
    return <p className="p-8 text-center">লোড হচ্ছে…</p>;
  }

  // read-only view if user has review and not editing
  if (existingReview && !editing) {
    return (
      <div className="container">
        {existingReview.length > 0 &&
          existingReview.map((item) => (
            <div
              key={item._id}
              className="p-6 bg-white border m-5 dark:bg-gray-800 rounded shadow"
            >
              <h2 className="text-2xl font-bold text-center mb-4">
                আপনার মন্তব্য
              </h2>
              <p className="mb-2">
                <strong>নাম:</strong> {item.userName}
              </p>
              <p className="mb-2">
                <strong>পেশা:</strong> {item.profession}
              </p>
              <p className="mb-4 whitespace-pre-wrap text-justify">
                “{item.reviewText}”
              </p>

              <button
                onClick={() => {
                  setEditing(true);
                  setReviewEditing(item);
                }}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
              >
                Edit Your Review
              </button>
            </div>
          ))}
      </div>
    );
  }

  // form for new or editing
  return (
    <div className="max-w-3xl mx-auto p-6 bg-gray-100 dark:bg-gray-800 rounded shadow">
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

        <button
          type="submit"
          disabled={uploading}
          className="w-full py-3 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          {uploading ? "জমা হচ্ছে…" : editing ? "আপডেট করুন" : "জমা দিন"}
        </button>
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
