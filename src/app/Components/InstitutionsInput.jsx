// src/app/components/InstitutionManager.jsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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

export default function InstitutionManager() {
  const { user, isLoaded } = useUser();
  const isAdmin = user?.publicMetadata?.isAdmin;

  // form setup
  const {
    register,
    control,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
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
    },
  });
  const {
    fields: deptFields,
    append,
    remove,
  } = useFieldArray({ control, name: "departments" });
  const formRef = useRef();

  // state
  const [institutions, setInstitutions] = useState(null);
  const [loadingList, setLoadingList] = useState(true);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [modal, setModal] = useState({
    isOpen: false,
    message: "",
    status: "",
  });
  const showModal = (m, s) => setModal({ isOpen: true, message: m, status: s });

  // fetch list
  const fetchList = useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await fetch("/api/institutions");
      const { institutions } = await res.json();
      setInstitutions(institutions);
    } catch {
      showModal("Failed to load list", "error");
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    if (isLoaded) fetchList();
  }, [isLoaded, fetchList]);

  // load for edit
  const loadForEdit = (inst) => {
    setEditingId(inst._id);
    formRef.current.scrollIntoView({ behavior: "smooth" });
    // populate fields
    for (const [k, v] of Object.entries(inst)) {
      if (k === "admissionPeriod") {
        setValue("admissionPeriod.openDate", v.openDate?.split("T")[0] || "");
        setValue("admissionPeriod.closeDate", v.closeDate?.split("T")[0] || "");
      } else if (k === "departments") {
        reset({ ...inst });
      } else {
        setValue(k, v);
      }
    }
  };

  // logo upload helpers
  let firebaseSignedIn = false;
  const ensureFirebase = async () => {
    if (firebaseSignedIn) return;
    const auth = getAuth();
    if (!auth.currentUser) {
      const { token } = await (await fetch("/api/firebase-token")).json();
      await signInWithCustomToken(auth, token);
    }
    firebaseSignedIn = true;
  };
  const uploadLogo = async (file) => {
    await ensureFirebase();
    const compressed =
      file.size > 1024 * 1024
        ? await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 1024 })
        : file;
    const storage = getStorage();
    const path = `institution-logos/${Date.now()}_${compressed.name}`;
    const task = uploadBytesResumable(storageRef(storage, path), compressed);
    return new Promise((res, rej) => {
      task.on("state_changed", null, rej, async () =>
        res(await getDownloadURL(task.snapshot.ref))
      );
    });
  };

  // submit create/update
  const onSubmit = async (data) => {
    if (!isAdmin) return showModal("Only admins may save", "error");
    setUploadingLogo(true);

    let logoUrl = institutions?.find((i) => i._id === editingId)?.logoUrl || "";
    if (data.logo?.[0]) logoUrl = await uploadLogo(data.logo[0]);

    const payload = { ...data, logoUrl };
    const url = "/api/institutions";
    const opts = {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingId ? { id: editingId, ...payload } : payload),
    };

    try {
      const res = await fetch(url, opts);
      if (!res.ok) throw new Error();
      showModal(`Saved successfully`, "success");
      reset();
      setEditingId(null);
      fetchList();
    } catch {
      showModal("Save failed", "error");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete?")) return;
    try {
      setInstitutions((lst) => lst.filter((i) => i._id !== id));
      await fetch("/api/institutions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      showModal("Deleted", "success");
    } catch {
      showModal("Delete failed", "error");
      fetchList();
    }
  };

  const handleToggleAdmission = async (inst) => {
    const newStatus = !inst.admissionStatus;
    setInstitutions((lst) =>
      lst.map((i) =>
        i._id === inst._id ? { ...i, admissionStatus: newStatus } : i
      )
    );
    await fetch("/api/institutions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: inst._id, admissionStatus: newStatus }),
    });
  };

  return (
    <div className="p-6 place-content-center container flex-wrap space-y-8">
      <div>
        <h2 className="text-3xl text-center font-bold mb-4">Institutions</h2>
        {loadingList ? (
          <div className="flex justify-center">
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
      {/* Form */}
      <div
        ref={formRef}
        className="w-[40rem]  mx-auto bg-white dark:bg-gray-800 p-6 rounded shadow"
      >
        <h2 className="text-2xl font-bold mb-4">
          {editingId ? "Edit" : "New"} Institution
        </h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block">Title*</label>
            <input
              {...register("title", { required: true })}
              placeholder="Institution title"
              className="w-full p-2 dark:bg-black  border rounded"
            />
            {errors.title && <span className="text-red-500">Required</span>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label>Code</label>
              <select
                aria-label="All"
                {...register("code", { required: true })}
                className="w-full p-2 dark:bg-black border rounded"
              >
                <option value="Primary">Primary</option>
                <option value="Sub-institute">Sub-institute</option>
                <option value="Partial">Partial</option>
                <option value="Non-academic">Non-academic</option>
              </select>
            </div>
            <div>
              <label>Established At*</label>
              <input
                type="number"
                {...register("establishedAt", { required: true })}
                placeholder="Institution establish year"
                className="w-full p-2 dark:bg-black border rounded"
              />
              {errors.email && <span className="text-red-500">Required</span>}
            </div>
            <div>
              <label>Email*</label>
              <input
                type="email"
                {...register("email", { required: true })}
                placeholder="Institution email"
                className="w-full p-2 dark:bg-black border rounded"
              />
              {errors.email && <span className="text-red-500">Required</span>}
            </div>
          </div>
          <div>
            <label>Description</label>
            <textarea
              {...register("description")}
              placeholder="Institution description"
              className="w-full p-2 dark:bg-black border rounded"
            />
          </div>
          <div>
            <label>Address*</label>
            <input
              {...register("address", { required: true })}
              className="w-full p-2 dark:bg-black border rounded"
            />
            {errors.address && <span className="text-red-500">Required</span>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label>Students</label>
              <input
                type="number"
                placeholder="Number of students"
                {...register("studentCount", { valueAsNumber: true })}
                className="w-full p-2 dark:bg-black border rounded"
              />
            </div>
            <div className="flex items-center">
              <input type="checkbox" {...register("admissionStatus")} />
              <label className="ml-2">Admission Open</label>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label>Open Date</label>
              <input
                type="date"
                {...register("admissionPeriod.openDate")}
                className="w-full p-2 dark:bg-black border rounded"
              />
            </div>
            <div>
              <label>Close Date</label>
              <input
                type="date"
                {...register("admissionPeriod.closeDate")}
                className="w-full p-2 dark:bg-black border rounded"
              />
            </div>
          </div>
          <div>
            <label className="block mb-1">Departments</label>
            {deptFields.map((d, i) => (
              <div key={d.id} className="flex items-center space-x-2 mb-2">
                <input
                  {...register(`departments.${i}.name`, { required: true })}
                  className="flex-1 p-2 border dark:bg-black rounded"
                  placeholder="Dept name"
                />
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="text-red-500"
                >
                  {" "}
                  X
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => append({ name: "" })}
              className="px-3 py-1 bg-green-500 text-white rounded"
            >
              + Dept
            </button>
          </div>
          <div>
            <label className="block mb-1">Logo</label>
            <input type="file" {...register("logo")} accept="image/*" />
          </div>
          <button
            type="submit"
            disabled={uploadingLogo}
            className="w-full py-2 bg-blue-600 text-white rounded"
          >
            {uploadingLogo ? "Saving…" : editingId ? "Update" : "Create"}
          </button>
        </form>
      </div>

      {/* Showcase */}

      <ResponseModal
        isOpen={modal.isOpen}
        message={modal.message}
        status={modal.status}
        onClose={() => setModal((m) => ({ ...m, isOpen: false }))}
      />
    </div>
  );
}

// small card sub‑component
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
          {inst.establishedAt
            ? new Date(inst.establishedAt).getFullYear()
            : "—"}
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
              onClick={() => onEdit(inst._id)}
              className="flex-1 px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded"
            >
              <FiEdit2 className="inline mr-1" /> Edit
            </button>
            <button
              onClick={() => onDelete(inst._id)}
              className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded"
            >
              <FiTrash2 className="inline mr-1" /> Delete
            </button>
            <button
              onClick={() => onToggleAdm(inst)}
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
