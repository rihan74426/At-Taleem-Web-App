"use client";
import { useEffect, useRef, useState } from "react";
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
import ResponseModal from "./ResponseModal";

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
  const [categories, setCategories] = useState([]); // All available categories from the store
  const [categoryInput, setCategoryInput] = useState("");
  const [bookCategories, setBookCategories] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  const [coverFile, setCoverFile] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const user = useUser().user;
  const [resModal, setResModal] = useState({
    isOpen: false,
    message: "",
    status: "",
  });

  const showResModal = (message, status) => {
    setResModal({ isOpen: true, message, status });
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories);
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Update suggestions when categoryInput, categories, or bookCategories change
  useEffect(() => {
    const input = categoryInput.trim().toLowerCase();
    const filtered = categories.filter(
      (cat) =>
        cat.name.toLowerCase().includes(input) &&
        !bookCategories.some((qc) => qc._id === cat._id)
    );
    setSuggestions(filtered);
  }, [categoryInput, categories, bookCategories]);

  // Handlers for input focus and blur
  const handleFocus = () => {
    setShowSuggestions(true);
  };

  const handleBlur = () => {
    setTimeout(() => setShowSuggestions(false), 100);
  };

  const handleChange = (e) => {
    setCategoryInput(e.target.value);
  };

  // Handle selecting an existing category
  const handleSelect = (cat) => {
    if (!bookCategories.some((c) => c._id === cat._id)) {
      const updated = [...bookCategories, cat];
      setBookCategories(updated);
    }
    setCategoryInput("");
    setShowSuggestions(false);
  };

  // Create a new category if none match the input and select it
  const handleAddNewCategory = async () => {
    if (!user?.publicMetadata?.isAdmin) {
      resModal.isOpen = true;
      showResModal(
        "You have to be an Admin to change anything restricted",
        "error"
      );
    } else {
      if (!categoryInput.trim()) return;
      try {
        const res = await fetch("/api/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: categoryInput.trim() }),
        });
        if (res.ok) {
          const newCat = await res.json();
          setCategories((prev) => [...prev, newCat]);
          setBookCategories((prev) => [...prev, newCat]);
          setCategoryInput("");
          setShowSuggestions(false);
        }
      } catch (err) {
        console.error("Error adding new category:", err);
      }
    }
  };

  // Remove a category from the question
  const removeCategory = (catId) => {
    setBookCategories((prev) => prev.filter((cat) => cat._id !== catId));
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
    e.preventDefault();
    if (!user?.publicMetadata?.isAdmin) {
      resModal.isOpen = true;
      showResModal(
        "You have to be an Admin to change anything restricted",
        "error"
      );
    } else {
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
            categories: bookCategories.map((c) => c._id),
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
        {/* Category Section */}
        <div className="mb-4 relative">
          <label className="block mb-1 text-sm font-semibold">
            Assign Categories:
          </label>
          <div className="flex flex-wrap gap-2">
            {bookCategories.map((cat) => (
              <div
                key={cat._id}
                className="flex items-center gap-1 bg-slate-700 text-blue-200 px-2 py-1 rounded hover:bg-red-500 hover:cursor-pointer"
                onClick={() => removeCategory(cat._id)}
                title="Click to remove"
              >
                <span>{cat.name}</span>
                <span className="text-red-600">&times;</span>
              </div>
            ))}
          </div>
          <input
            ref={inputRef}
            type="text"
            placeholder="Add a category..."
            value={categoryInput}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className="w-full border p-2 rounded mt-2 dark:bg-black"
          />
          {showSuggestions && (
            <div className="absolute top-full left-0 right-0 border rounded bg-white dark:bg-gray-800 mt-1 z-10 max-h-48 overflow-auto">
              {suggestions.length > 0 ? (
                suggestions.map((cat) => (
                  <div
                    key={cat._id}
                    onMouseDown={() => handleSelect(cat)}
                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"
                  >
                    {cat.name}
                  </div>
                ))
              ) : (
                <div
                  onMouseDown={handleAddNewCategory}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"
                >
                  Add "{categoryInput}" as a new category
                </div>
              )}
            </div>
          )}
        </div>
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

        {/* You can add a category selection component here if needed */}
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-500 text-white py-2 rounded"
        >
          {loading ? "Saving..." : "Save Book"}
        </button>
      </form>
      <ResponseModal
        isOpen={resModal.isOpen}
        message={resModal.message}
        status={resModal.status}
        onClose={() => setResModal({ ...resModal, isOpen: false })}
      />
    </div>
  );
}
