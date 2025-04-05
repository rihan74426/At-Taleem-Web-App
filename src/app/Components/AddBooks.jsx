"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/firebase"; // Adjust path based on your project

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

  const uploadFile = async (file, path) => {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  };

  const handleSubmit = async (e) => {
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
    } catch (err) {
      console.error(err);
      alert("Error saving book");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4 dark:text-gray-700">
      <h1 className="text-2xl font-bold mb-4">Add a Book</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="Book Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Author"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          required
        />

        <label className="font-semibold">Cover Image</label>
        {!coverImage && (
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setCoverFile(e.target.files[0])}
          />
        )}
        {coverImage && (
          <img
            src={coverImage}
            alt="Cover"
            className="w-32 h-32 object-cover"
          />
        )}

        <input
          type="number"
          placeholder="Price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
        />

        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <label className="font-semibold">Upload Full Book (PDF)</label>
        {!fullPdfUrl && (
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setPdfFile(e.target.files[0])}
          />
        )}
        {fullPdfUrl && <p className="text-green-500 text-sm">PDF uploaded ✔</p>}

        <input
          type="number"
          placeholder="Free Preview Pages"
          value={freePages}
          onChange={(e) => setFreePages(Number(e.target.value))}
          required
        />
        <label className="font-semibold">
          How many pages do you want to preview for free?
        </label>

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
