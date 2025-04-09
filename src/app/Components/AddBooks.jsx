"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import { useAuth, useUser } from "@clerk/nextjs";
import { app } from "@/firebase"; // your firebase.js
import { getAuth, signInWithCustomToken } from "firebase/auth";

export default function AddBookForm({ initialBook, onSuccess }) {
  const router = useRouter();
  const [title, setTitle] = useState(initialBook?.title || "");
  const [author, setAuthor] = useState(initialBook?.author || "");
  const [coverImage, setCoverImage] = useState(initialBook?.coverImage || "");
  const [price, setPrice] = useState(initialBook?.price || "");
  const [description, setDescription] = useState(
    initialBook?.description || ""
  );
  const [fullPdfUrl, setFullPdfUrl] = useState(initialBook?.fullPdfUrl || "");
  const [freePages, setFreePages] = useState(initialBook?.freePages || 0);
  const [categories, setCategories] = useState(initialBook?.categories || []);
  const [loading, setLoading] = useState(false);

  const [coverFile, setCoverFile] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const user = useUser().user;

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

  const handleSubmit = async (e) => {
    if (!user?.publicMetadata?.isAdmin) {
      alert("You are not an admin");
    } else {
      e.preventDefault();
      setLoading(true);

      try {
        let uploadedCoverUrl = coverImage;
        let uploadedPdfUrl = fullPdfUrl;

        // Upload cover image if a new file is selected
        if (coverFile) {
          uploadedCoverUrl = await uploadFile(
            coverFile,
            `covers/${coverFile.name}`
          );
        }

        // Upload book PDF if a new file is selected
        if (pdfFile) {
          uploadedPdfUrl = await uploadFile(pdfFile, `books/${pdfFile.name}`);
        }
        if (
          title === "" ||
          description === "" ||
          freePages === "" ||
          author === "" ||
          price === ""
        ) {
          alert("Missing required fields");
        } else {
          const bookData = {
            title,
            author,
            coverImage: uploadedCoverUrl,
            price,
            description,
            fullPdfUrl: uploadedPdfUrl,
            freePages,
            categories,
          };

          const res = initialBook
            ? await fetch(`/api/books/${initialBook._id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(bookData),
              })
            : await fetch("/api/books", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(bookData),
              });

          if (res.ok) {
            const data = await res.json();
            onSuccess && onSuccess(data);
            router.push("/published-books");
          } else {
            const errorData = await res.json();
            alert(errorData.error || "Error saving book");
          }
        }
      } catch (err) {
        console.error(err);
        alert("Error saving book");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4 text-center">
        {initialBook ? "Edit Book" : "Add New Book"}
      </h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <label className="font-semibold">Title</label>
        <input
          type="text"
          className="dark:bg-gray-800"
          placeholder="Book Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <label className="font-semibold">Author</label>
        <input
          type="text"
          placeholder="Author"
          className="dark:bg-gray-800"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          required
        />

        <label className="font-semibold">Cover Image</label>
        {!coverImage ? (
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setCoverFile(e.target.files[0])}
          />
        ) : (
          <div className="flex items-center">
            <img
              src={coverImage}
              alt="Cover"
              className="w-32 h-32 object-cover"
            />
            <button
              onClick={() => setCoverImage(null)}
              className="bg-red-500 p-2 h-fit ml-5 rounded text-white"
            >
              Remove This Photo
            </button>
          </div>
        )}
        <label className="font-semibold">Price</label>
        <input
          type="number"
          placeholder="Price"
          className="dark:bg-gray-800"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
        />
        <label className="font-semibold">Description</label>
        <textarea
          placeholder="Description"
          className="dark:bg-gray-800"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <label className="font-semibold">Upload Full Book (PDF)</label>
        {!fullPdfUrl ? (
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setPdfFile(e.target.files[0])}
          />
        ) : (
          <div className="flex items-center">
            <p className="text-green-500 text-sm">PDF uploaded ✔</p>
            <button
              onClick={() => setPdfFile(null)}
              className="bg-red-500 p-2 rounded ml-5 text-white"
            >
              Remove This PDF
            </button>
          </div>
        )}
        <label>Free Pages</label>
        <input
          type="number"
          className="dark:bg-gray-800"
          placeholder="Free Preview Pages"
          value={freePages}
          onChange={(e) => setFreePages(Number(e.target.value))}
          required
        />

        {/* You can add a category selection component here if needed */}

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-500 text-white py-2 rounded"
        >
          {loading ? "Saving..." : "Save Book"}
        </button>
      </form>
    </div>
  );
}
