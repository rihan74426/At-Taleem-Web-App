// src/app/components/InstitutionManager.jsx
"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useUser } from "@clerk/nextjs";
import { getAuth, signInWithCustomToken } from "firebase/auth";
import {
  getStorage,
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import imageCompression from "browser-image-compression";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import ResponseModal from "./ResponseModal";
import Loader from "./Loader";
import { motion } from "framer-motion";
import Image from "next/image";

// Default form values extracted to avoid repetition
const DEFAULT_FORM_VALUES = {
  title: "",
  code: "Sub-institute",
  establishedAt: "",
  description: "",
  email: "",
  phone: "",
  address: "",
  studentCount: 0,
  admissionStatus: false,
  admissionPeriod: { openDate: "", closeDate: "" },
  departments: [{ name: "" }],
  social: {
    facebook: "",
    twitter: "",
    instagram: "",
    linkedin: "",
    youtube: "",
  },
};

// Separate API service for cleaner code organization
const institutionAPI = {
  getAll: async () => {
    const res = await fetch("/api/institutions");
    return res.json();
  },
  create: async (payload) => {
    return fetch("/api/institutions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },
  update: async (id, payload) => {
    return fetch("/api/institutions", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...payload }),
    });
  },
  delete: async (id) => {
    return fetch("/api/institutions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  },
  toggleAdmission: async (id, status) => {
    return fetch("/api/institutions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, admissionStatus: status }),
    });
  },
};

// Firebase helper as separate utility
const firebaseUtils = {
  isSignedIn: false,

  ensureAuth: async () => {
    if (firebaseUtils.isSignedIn) return;

    const auth = getAuth();
    if (!auth.currentUser) {
      const { token } = await (await fetch("/api/firebase-token")).json();
      await signInWithCustomToken(auth, token);
    }
    firebaseUtils.isSignedIn = true;
  },

  uploadImage: async (file) => {
    await firebaseUtils.ensureAuth();

    const options = { maxSizeMB: 1, maxWidthOrHeight: 1024 };
    const compressed =
      file.size > 1024 * 1024 ? await imageCompression(file, options) : file;

    const storage = getStorage();
    const path = `institution-logos/${Date.now()}_${compressed.name}`;
    const fileRef = storageRef(storage, path);
    const task = uploadBytesResumable(fileRef, compressed);

    return new Promise((resolve, reject) => {
      task.on("state_changed", null, reject, async () =>
        resolve(await getDownloadURL(task.snapshot.ref))
      );
    });
  },
};

// Extracted to a separate component for better organization
function InstitutionCard({ inst, isAdmin, onEdit, onDelete, onToggleAdm }) {
  return (
    <motion.div
      key={inst._id}
      className="bg-white dark:bg-gray-800 border rounded-lg shadow-sm flex flex-col"
      whileHover={{ scale: 1.02, boxShadow: "0 10px 20px rgba(0,0,0,0.1)" }}
    >
      <div className="relative h-40 w-full bg-gray-100">
        {inst.logoUrl ? (
          <Image
            src={inst.logoUrl}
            alt={inst.title}
            fill
            className="object-contain p-4"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            No Logo
          </div>
        )}
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <h2 className="text-xl font-semibold">{inst.title}</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 truncate">
          {inst.description}
        </p>
        <p className="text-sm mb-1">
          <strong>Students:</strong> {inst.studentCount}
        </p>
        <p className="text-sm mb-4">
          <strong>Established:</strong>{" "}
          {inst.establishedAt ? inst.establishedAt : "—"}
        </p>
        <span
          className={`inline-block px-2 py-1 text-sm rounded self-start mb-4 ${
            inst.admissionStatus
              ? "bg-green-200 text-green-800"
              : "bg-red-200 text-red-800"
          }`}
        >
          Admission {inst.admissionStatus ? "Open" : "Closed"}
        </span>
        {isAdmin && (
          <div className="mt-auto flex space-x-2">
            <button
              onClick={onEdit}
              className="flex-1 px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded"
            >
              <FiEdit2 className="inline mr-1" /> Edit
            </button>
            <button
              onClick={onDelete}
              className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded"
            >
              <FiTrash2 className="inline mr-1" /> Delete
            </button>
            <button
              onClick={onToggleAdm}
              className={`px-3 py-1 rounded text-white ${
                inst.admissionStatus
                  ? "bg-gray-500 hover:bg-gray-600"
                  : "bg-green-500 hover:bg-green-600"
              }`}
            >
              {inst.admissionStatus ? "Close" : "Open"}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function InstitutionManager() {
  const { user, isLoaded } = useUser();
  const isAdmin = useMemo(() => user?.publicMetadata?.isAdmin, [user]);
  const formRef = useRef(null);

  // State management
  const [institutions, setInstitutions] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingInst, setEditingInst] = useState(null);
  const [modal, setModal] = useState({
    isOpen: false,
    message: "",
    status: "",
  });

  // Form setup with react-hook-form
  const {
    register,
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: DEFAULT_FORM_VALUES,
  });

  const {
    fields: deptFields,
    append,
    remove,
  } = useFieldArray({ control, name: "departments" });

  // Modal helper function
  const showModal = useCallback((message, status) => {
    setModal({ isOpen: true, message, status });
  }, []);

  // Fetch institutions list
  const fetchList = useCallback(async () => {
    setLoadingList(true);
    try {
      const { institutions } = await institutionAPI.getAll();
      setInstitutions(institutions);
    } catch (error) {
      console.error("Failed to load institutions:", error);
      showModal("Failed to load list", "error");
    } finally {
      setLoadingList(false);
    }
  }, [showModal]);

  // Load data when component mounts
  useEffect(() => {
    if (isLoaded) fetchList();
  }, [isLoaded, fetchList]);

  // Load institution data for editing
  const loadForEdit = useCallback(
    (inst) => {
      setEditingId(inst._id);
      setEditingInst(inst);

      // Reset form with institution data
      reset(inst);

      // Special handling for date fields
      if (inst.admissionPeriod) {
        setValue(
          "admissionPeriod.openDate",
          inst.admissionPeriod.openDate?.split("T")[0] || ""
        );
        setValue(
          "admissionPeriod.closeDate",
          inst.admissionPeriod.closeDate?.split("T")[0] || ""
        );
      }

      // Scroll to form
      formRef.current?.scrollIntoView({ behavior: "smooth" });
    },
    [reset, setValue]
  );

  // Form submission handler
  const onSubmit = async (data) => {
    if (!isAdmin) {
      return showModal("Only admins may save", "error");
    }

    setUploadingLogo(true);

    try {
      // Handle logo upload if new logo selected
      let logoUrl = editingInst?.logoUrl || "";
      if (data.logo?.[0]) {
        logoUrl = await firebaseUtils.uploadImage(data.logo[0]);
      }

      const payload = { ...data, logoUrl };

      // Create or update institution
      const res = editingId
        ? await institutionAPI.update(editingId, payload)
        : await institutionAPI.create(payload);

      if (!res.ok) throw new Error("API request failed");

      showModal(`Saved successfully`, "success");
      reset(DEFAULT_FORM_VALUES);
      setEditingId(null);
      setEditingInst(null);
      fetchList();
    } catch (error) {
      console.error("Save failed:", error);
      showModal("Save failed", "error");
    } finally {
      setUploadingLogo(false);
    }
  };

  // Delete institution handler
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this institution?")) return;

    try {
      // Optimistic update
      setInstitutions((prev) => prev.filter((i) => i._id !== id));

      const res = await institutionAPI.delete(id);
      if (!res.ok) throw new Error("Delete failed");

      showModal("Institution deleted successfully", "success");
    } catch (error) {
      console.error("Delete failed:", error);
      showModal("Delete failed", "error");
      // Revert optimistic update on failure
      fetchList();
    }
  };

  // Toggle admission status handler
  const handleToggleAdmission = async (inst) => {
    const newStatus = !inst.admissionStatus;

    try {
      // Optimistic update
      setInstitutions((prev) =>
        prev.map((i) =>
          i._id === inst._id ? { ...i, admissionStatus: newStatus } : i
        )
      );

      const res = await institutionAPI.toggleAdmission(inst._id, newStatus);
      if (!res.ok) throw new Error("Toggle failed");
    } catch (error) {
      console.error("Toggle admission failed:", error);
      // Revert optimistic update on failure
      fetchList();
    }
  };

  return (
    <div className="p-6 place-content-center container flex-wrap space-y-8">
      {/* Institutions List */}
      <div>
        <h2 className="text-3xl text-center font-bold mb-4">Institutions</h2>
        {loadingList ? (
          <div className="flex justify-center min-h-64">
            <Loader />
          </div>
        ) : institutions?.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {institutions.map((inst) => (
              <InstitutionCard
                key={inst._id}
                inst={inst}
                isAdmin={isAdmin}
                onEdit={() => loadForEdit(inst)}
                onDelete={() => handleDelete(inst._id)}
                onToggleAdm={() => handleToggleAdmission(inst)}
              />
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500">No institutions yet.</p>
        )}
      </div>

      {/* Institution Form */}
      <div
        ref={formRef}
        className="w-full max-w-2xl mx-auto bg-white dark:bg-gray-800 p-6 rounded shadow"
      >
        <h2 className="text-2xl text-center font-bold mb-4">
          {editingId ? "Edit" : "Add New"} Institution
        </h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block">Title*</label>
            <input
              {...register("title", { required: "Title is required" })}
              placeholder="Institution title"
              className="w-full p-2 border rounded dark:bg-black"
            />
            {errors.title && (
              <span className="text-red-500">
                {errors.title.message || "Required"}
              </span>
            )}
          </div>

          {/* Code + Established Year */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label>Code*</label>
              <select
                {...register("code", { required: "Code is required" })}
                className="w-full p-2 border rounded dark:bg-black"
              >
                <option value="Primary">Primary</option>
                <option value="Sub-institute">Sub-institute</option>
                <option value="Partial">Partial</option>
                <option value="Non-academic">Non-academic</option>
              </select>
              {errors.code && (
                <span className="text-red-500">
                  {errors.code.message || "Required"}
                </span>
              )}
            </div>
            <div>
              <label>Established At*</label>
              <input
                type="number"
                {...register("establishedAt", {
                  required: "Established year is required",
                })}
                placeholder="e.g., 1999"
                className="w-full p-2 border rounded dark:bg-black"
              />
              {errors.establishedAt && (
                <span className="text-red-500">
                  {errors.establishedAt.message || "Required"}
                </span>
              )}
            </div>
          </div>

          {/* Email + Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label>Email*</label>
              <input
                type="email"
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email address",
                  },
                })}
                className="w-full p-2 border rounded dark:bg-black"
              />
              {errors.email && (
                <span className="text-red-500">
                  {errors.email.message || "Required"}
                </span>
              )}
            </div>
            <div>
              <label>Phone Number*</label>
              <input
                type="tel"
                {...register("phone", { required: "Phone number is required" })}
                className="w-full p-2 border rounded dark:bg-black"
              />
              {errors.phone && (
                <span className="text-red-500">
                  {errors.phone.message || "Required"}
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label>Description</label>
            <textarea
              {...register("description")}
              placeholder="Institution description"
              className="w-full p-2 border rounded dark:bg-black"
              rows={3}
            />
          </div>

          {/* Address */}
          <div>
            <label>Address*</label>
            <input
              {...register("address", { required: "Address is required" })}
              className="w-full p-2 border rounded dark:bg-black"
            />
            {errors.address && (
              <span className="text-red-500">
                {errors.address.message || "Required"}
              </span>
            )}
          </div>

          {/* Students + Admission */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label>Number of Students</label>
              <input
                type="number"
                {...register("studentCount", {
                  valueAsNumber: true,
                  min: {
                    value: 0,
                    message: "Cannot be negative",
                  },
                })}
                className="w-full p-2 border rounded dark:bg-black"
              />
              {errors.studentCount && (
                <span className="text-red-500">
                  {errors.studentCount.message}
                </span>
              )}
            </div>
            <div className="flex items-center mt-6">
              <input
                type="checkbox"
                id="admissionStatus"
                {...register("admissionStatus")}
              />
              <label htmlFor="admissionStatus" className="ml-2">
                Admission Open
              </label>
            </div>
          </div>

          {/* Admission Period */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label>Admission Open Date</label>
              <input
                type="date"
                {...register("admissionPeriod.openDate")}
                className="w-full p-2 border rounded dark:bg-black"
              />
            </div>
            <div>
              <label>Admission Close Date</label>
              <input
                type="date"
                {...register("admissionPeriod.closeDate")}
                className="w-full p-2 border rounded dark:bg-black"
              />
            </div>
          </div>

          {/* Departments */}
          <div>
            <label className="block mb-1">Departments</label>
            {deptFields.map((d, i) => (
              <div key={d.id} className="flex items-center space-x-2 mb-2">
                <input
                  {...register(`departments.${i}.name`, {
                    required: "Department name is required",
                  })}
                  className="flex-1 p-2 border rounded dark:bg-black"
                  placeholder="Department name"
                />
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="text-red-500"
                  aria-label="Remove department"
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => append({ name: "" })}
              className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
            >
              + Add Department
            </button>
          </div>

          {/* Social Links */}
          <div>
            <label className="block mb-1">Social Links</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                {...register("social.facebook")}
                placeholder="Facebook URL"
                className="w-full p-2 border rounded dark:bg-black"
              />
              <input
                {...register("social.twitter")}
                placeholder="Twitter URL"
                className="w-full p-2 border rounded dark:bg-black"
              />
              <input
                {...register("social.instagram")}
                placeholder="Instagram URL"
                className="w-full p-2 border rounded dark:bg-black"
              />
              <input
                {...register("social.linkedin")}
                placeholder="LinkedIn URL"
                className="w-full p-2 border rounded dark:bg-black"
              />
              <input
                {...register("social.youtube")}
                placeholder="YouTube URL"
                className="w-full p-2 border rounded dark:bg-black"
              />
            </div>
          </div>

          {/* Logo Upload */}
          {editingInst?.logoUrl ? (
            <div className="flex items-center">
              <Image
                src={editingInst.logoUrl}
                alt={`${editingInst.title} Logo`}
                width={128}
                height={128}
                className="object-cover rounded-full"
              />
              <button
                type="button"
                onClick={() => {
                  setValue("logo", null);
                  setEditingInst((prev) => ({ ...prev, logoUrl: null }));
                }}
                className="bg-red-500 p-2 ml-5 rounded text-white hover:bg-red-600"
              >
                Remove This Photo
              </button>
            </div>
          ) : (
            <div>
              <label className="block mb-1">Logo</label>
              <input
                type="file"
                {...register("logo")}
                accept="image/*"
                className="w-full"
              />
            </div>
          )}

          {/* Submit / Cancel Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => {
                reset(DEFAULT_FORM_VALUES);
                setEditingId(null);
                setEditingInst(null);
              }}
              className="w-full py-3 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploadingLogo}
              className="w-full py-3 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {uploadingLogo
                ? "Submitting..."
                : editingId
                ? "Update"
                : "Submit"}
            </button>
          </div>
        </form>
      </div>

      {/* Modal for notifications */}
      <ResponseModal
        isOpen={modal.isOpen}
        message={modal.message}
        status={modal.status}
        onClose={() => setModal((m) => ({ ...m, isOpen: false }))}
      />
    </div>
  );
}
