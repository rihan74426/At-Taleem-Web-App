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

  // 1. on mount, fetch this user's review
  useEffect(() => {
    if (!isLoaded) return;
    (async () => {
      const res = await fetch(`/api/reviews`);
      if (res.ok) {
        const { reviews } = await res.json();

        setExistingReview(
          reviews.map((item) => {
            item.userId === user.id;
          })
        );
      }
      setLoadingReview(false);
    })();
  }, [isLoaded, user]);

  // 2. when entering edit mode, populate form
  useEffect(() => {
    if (editing && existingReview) {
      setValue("name", existingReview.userName);
      setValue("profession", existingReview.profession);
      setValue("review", existingReview.reviewText);
      setValue("showPicture", existingReview.userProfilePic ? "true" : "false");
    }
  }, [editing, existingReview, setValue]);

  // utility: compress if >1MB
  const compressIfNeeded = async (file) => {
    if (file.size <= 1024 * 1024) return file;
    return await imageCompression(file, {
      maxSizeMB: 1,
      maxWidthOrHeight: 1024,
      useWebWorker: true,
    });
  };

  // utility: upload to Firebase
  const uploadFile = async (file) => {
    const storage = getStorage(app);
    const path = `profile-pictures/${Date.now()}_${file.name}`;
    const uploadTask = uploadBytesResumable(ref(storage, path), file);
    return new Promise((resolve, reject) => {
      uploadTask.on("state_changed", null, reject, async () => {
        resolve(await getDownloadURL(uploadTask.snapshot.ref));
      });
    });
  };

  // 3. form submission handles both create & update
  const onSubmit = async (data) => {
    if (!user) return showModal("অনুগ্রহ করে প্রথমে লগইন করুন।", "error");
    setUploading(true);

    try {
      let imageUrl = existingReview?.userProfilePic || "";

      if (data.showPicture === "true" && data.image?.length) {
        let file = data.image[0];
        file = await compressIfNeeded(file);
        if (makePP) {
          if (makePP) {
            const res = await user.setProfileImage({ file });
            imageUrl = res.publicUrl || imageUrl;
          } else {
            imageUrl = await uploadFile(file);
          }
        }

        const payload = {
          userName: data.name,
          profession: data.profession,
          reviewText: data.review,
          userProfilePic: imageUrl || null,
        };

        const endpoint = "/api/reviews";

        const method = editing ? "PUT" : "POST";

        const res = await fetch(endpoint, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, userId: user.id }),
        });

        if (!res.ok) throw new Error("Server error");

        showModal("মন্তব্য সফলভাবে জমা হয়েছে!", "success");
        reset();
        setEditing(false);
        // refresh the displayed review
        setExistingReview((prev) => ({
          ...prev,
          ...payload,
        }));
      }
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

  // if user already has a review and is not an admin & not editing, show read-only
  const isAdmin = user.publicMetadata?.isAdmin;
  if (existingReview && !isAdmin && !editing) {
    return (
      <div className="max-w-xl mx-auto p-6 bg-white dark:bg-gray-800 rounded shadow">
        <h2 className="text-2xl font-bold mb-4">আপনার মন্তব্য</h2>
        <p className="mb-2">
          <strong>নাম:</strong> {existingReview.userName}
        </p>
        <p className="mb-2">
          <strong>পেশা:</strong> {existingReview.profession}
        </p>
        <p className="mb-4">{existingReview.reviewText}</p>
        <button
          onClick={() => setEditing(true)}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
        >
          Edit Your Review
        </button>
      </div>
    );
  }

  // otherwise show the form (new or admin or editing)
  return (
    <div className="max-w-3xl mx-auto p-6 bg-gray-100 dark:bg-gray-800 rounded shadow">
      <h2 className="text-2xl font-bold mb-6 text-center">
        {editing
          ? "Edit Your Review"
          : existingReview
          ? "Submit Another Review"
          : "Share Your Review"}
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block mb-1">নাম</label>
          <input
            {...register("name", { required: true })}
            className="w-full p-3 border rounded"
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
            className="w-full p-3 border rounded"
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
            className="w-full p-3 border rounded h-28"
            disabled={uploading}
          />
          {errors.review && (
            <span className="text-red-500 text-sm">প্রয়োজন</span>
          )}
        </div>

        <div>
          <label className="block mb-1">ছবি যুক্ত করবেন?</label>
          <select
            {...register("showPicture")}
            className="w-full p-3 border rounded"
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
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const compressed = await compressIfNeeded(file);
                  setValue("image", [compressed], { shouldValidate: true });
                }
              }}
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
