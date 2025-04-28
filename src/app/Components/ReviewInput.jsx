"use client";

import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import {
  uploadBytes,
  ref,
  getDownloadURL,
  uploadBytesResumable,
  getStorage,
} from "firebase/storage";
import { app, storage } from "@/firebase"; // your firebase config
import { currentUser, updateUser, useUser } from "@clerk/nextjs"; // Clerk
import { useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import ResponseModal from "./ResponseModal";

export default function ReviewInputPage() {
  const { register, handleSubmit, watch, reset } = useForm();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [makePP, setMakePP] = useState(false);
  const [modal, setModal] = useState({
    isOpen: false,
    message: "",
    status: "",
  });
  const showModal = (message, status) =>
    setModal({ isOpen: true, message, status });

  const showPicture = watch("showPicture");
  const user = useUser();

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

  const uploadFile = async (file, path) => {
    await ensureFirebaseSignedIn();

    return new Promise((resolve, reject) => {
      const storage = getStorage(app);
      const fileRef = ref(storage, path);
      const uploadTask = uploadBytesResumable(fileRef, file);

      uploadTask.on(
        "state_changed",
        null,
        (err) => reject(err),
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          } catch (err) {
            reject(err);
          }
        }
      );
    });
  };

  const onSubmit = async (data) => {
    if (!user?.isSignedIn)
      return showModal("মন্তব্য প্রকাশের জন্য দয়া করে লগিন করুন!", "error");

    try {
      setUploading(true);

      let imageUrl = "";

      // if user wants to show a picture
      if (data.showPicture && data.image && data.image.length > 0) {
        const fileObj = data.image[0];

        if (makePP) {
          const res = await user.user.setProfileImage({ file: fileObj });
          if (res.publicUrl) imageUrl = res.publicUrl;
        } else {
          imageUrl = await uploadFile(
            fileObj,
            `profile-pictures/${Date.now()}_${fileObj.name}`
          );
        }
      }

      // now imageUrl is definitely a string (or empty string)
      const reviewPayload = {
        userId: user.user.id,
        userName: data.name,
        profession: data.profession,
        reviewText: data.review,
        userProfilePic: imageUrl || null,
      };

      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reviewPayload),
      });

      if (res.ok) {
        reset();
        showModal("আপনার মন্তব্যটি গৃহিত হয়েছে!", "success");
      } else {
        throw new Error("Server rejected the review");
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong!");
      showModal("কিছু সমস্যা হয়েছে, পরে আবার চেষ্টা করুন।", "error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-gray-200 dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center text-teal-600 dark:text-teal-300">
        তালিম সম্পর্কে আপনার মন্তব্য ও ফলাফল
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="block text-gray-700 dark:text-gray-100 font-semibold mb-2">
            নামঃ
          </label>
          <input
            {...register("name", { required: true })}
            className="w-full border rounded-md p-3 dark:bg-black focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="আপনার নাম"
          />
        </div>

        <div>
          <label className="block text-gray-700 dark:text-gray-100 font-semibold mb-2">
            পেশাঃ
          </label>
          <input
            {...register("profession", { required: true })}
            className="w-full border rounded-md p-3  dark:bg-black focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="আপনার পেশা"
          />
        </div>

        <div>
          <label className="block text-gray-700 dark:text-gray-100 font-semibold mb-2">
            আপনার কথাঃ
          </label>
          <textarea
            {...register("review", { required: true })}
            className="w-full border rounded-md p-3 h-32  dark:bg-black resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="তালিমে আসার পর আপনার পরিবর্তনের কথা সবিস্তারে লিখুন..."
          ></textarea>
        </div>

        <div>
          <label className="block text-gray-700  dark:bg-black dark:text-gray-100 font-semibold mb-2">
            আপনি কী ছবি যুক্ত করতে ইচ্ছুক?
          </label>
          <select
            {...register("showPicture")}
            className="w-full border rounded-md p-3  dark:bg-black focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="false">না</option>
            <option value="true">হ্যাঁ</option>
          </select>
        </div>

        {showPicture === "true" && (
          <div>
            <label className="block text-gray-700 dark:text-gray-100 font-semibold mb-2">
              আপনার ছবি যুক্ত করুন
            </label>
            <input
              type="file"
              {...register("image")}
              accept="image/*"
              className="w-full p-2 border  dark:bg-black rounded-md"
            />
            <label className="block text-gray-700  dark:bg-black dark:text-gray-100 font-semibold mb-2">
              <input
                type="checkbox"
                checked={makePP}
                onChange={(e) => setMakePP(e.target.checked)}
                className="m-3"
              />
              ছবিটি প্রোফাইল পিক হিসেবে সেট করতে চান?
            </label>
          </div>
        )}

        {error && <p className="text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={uploading}
          className="w-full bg-blue-500 text-white p-3  rounded-md hover:bg-blue-600 transition duration-300 font-semibold"
        >
          {uploading ? "Submitting..." : "Submit Review"}
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
