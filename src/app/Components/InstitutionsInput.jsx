// src/app/components/InstitutionInputPage.jsx
"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { useEffect, useRef, useState, useCallback } from "react";
import imageCompression from "browser-image-compression";
import {
  uploadBytesResumable,
  ref as storageRef,
  getDownloadURL,
  getStorage,
} from "firebase/storage";
import { app } from "@/firebase";
import { useUser } from "@clerk/nextjs";
import ResponseModal from "./ResponseModal";
import { getAuth, signInWithCustomToken } from "firebase/auth";

export default function InstitutionInputPage() {
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: "",
      code: "",
      description: "",
      email: "",
      phone: "",
      address: "",
      establishedAt: "",
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
    append: appendDept,
    remove: removeDept,
  } = useFieldArray({ control, name: "departments" });
  const [loading, setLoading] = useState(true);
  const [institution, setInstitution] = useState(null);
  const [editing, setEditing] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [modal, setModal] = useState({
    isOpen: false,
    message: "",
    status: "",
  });
  const formRef = useRef(null);
  const { user, isLoaded } = useUser();

  const showModal = (msg, status) =>
    setModal({ isOpen: true, message: msg, status });

  // get id from URL if present
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  // fetch existing institution if id
  const fetchInstitution = useCallback(async () => {
    if (!id) return setLoading(false);
    const res = await fetch(`/api/institutions?id=${id}`);
    if (res.ok) {
      const { institution } = await res.json();
      setInstitution(institution);
      // populate form
      for (const [k, v] of Object.entries(institution)) {
        if (k === "admissionPeriod") {
          setValue("admissionPeriod.openDate", v.openDate?.split("T")[0] || "");
          setValue(
            "admissionPeriod.closeDate",
            v.closeDate?.split("T")[0] || ""
          );
        } else if (k === "departments") {
          reset({ ...institution });
        } else {
          setValue(k, v);
        }
      }
      setEditing(true);
    }
    setLoading(false);
  }, [id, setValue, reset]);

  useEffect(() => {
    if (isLoaded) fetchInstitution();
  }, [isLoaded, fetchInstitution]);

  // scroll into view when editing
  useEffect(() => {
    if (editing) formRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [editing]);

  // compress logo if >1MB
  const compressIfNeeded = async (file) => {
    if (file.size <= 1024 * 1024) return file;
    return imageCompression(file, {
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
      const tokRes = await fetch("/api/firebase-token");
      const { token } = await tokRes.json();
      await signInWithCustomToken(auth, token);
    }
    firebaseSignedIn = true;
  };
  const uploadLogo = async (file) => {
    await ensureFirebaseSignedIn();
    const storage = getStorage(app);
    const path = `institution-logos/${Date.now()}_${file.name}`;
    const task = uploadBytesResumable(storageRef(storage, path), file);
    return new Promise((resolve, reject) => {
      task.on("state_changed", null, reject, async () => {
        resolve(await getDownloadURL(task.snapshot.ref));
      });
    });
  };

  const onSubmit = async (data) => {
    if (!user.publicMetadata.isAdmin) {
      showModal("Only admins may perform this action", "error");
      return;
    }
    setUploadingLogo(true);
    let logoUrl = institution?.logoUrl || "";
    if (data.logo?.[0]) {
      const file = await compressIfNeeded(data.logo[0]);
      logoUrl = await uploadLogo(file);
    }
    const payload = { ...data, logoUrl };
    const method = editing ? "PUT" : "POST";
    try {
      const res = await fetch("/api/institutions", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing ? { id, ...payload } : payload),
      });
      if (!res.ok) throw new Error();
      showModal(
        `Institution ${editing ? "updated" : "created"} successfully`,
        "success"
      );
      if (!editing) reset();
    } catch {
      showModal("Failed to save institution", "error");
    } finally {
      setUploadingLogo(false);
    }
  };

  if (!isLoaded || loading) return <p className="p-8 text-center">Loading…</p>;

  return (
    <div
      ref={formRef}
      className="w-[40rem] mx-auto p-6 bg-white dark:bg-gray-800 m-5 rounded-lg shadow"
    >
      <h2 className="text-2xl font-bold mb-4">
        {editing ? "Edit Institution" : "Create Institution"}
      </h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* basic */}
        <div>
          <label className="block font-semibold">Title*</label>
          <input
            {...register("title", { required: true })}
            type="text"
            className="w-full p-2 border dark:bg-black rounded"
            disabled={uploadingLogo}
          />
          {errors.title && <span className="text-red-500">Required</span>}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold">Code</label>
            <input
              {...register("code")}
              type="text"
              className="w-full p-2 border dark:bg-black rounded"
              disabled={uploadingLogo}
            />
          </div>
          <div>
            <label className="block font-semibold">Email*</label>
            <input
              type="email"
              {...register("email", { required: true })}
              className="w-full p-2 border dark:bg-black rounded"
              disabled={uploadingLogo}
            />
            {errors.email && <span className="text-red-500">Required</span>}
          </div>
        </div>
        <div>
          <label className="block font-semibold">Description</label>
          <textarea
            {...register("description")}
            className="w-full p-2 border dark:bg-black rounded"
            disabled={uploadingLogo}
          />
        </div>
        {/* address & phone */}
        <div>
          <label className="block font-semibold">Address*</label>
          <input
            {...register("address", { required: true })}
            className="w-full p-2 border dark:bg-black rounded"
            disabled={uploadingLogo}
          />
          {errors.address && <span className="text-red-500">Required</span>}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold">Phone</label>
            <input
              {...register("phone")}
              className="w-full p-2 border dark:bg-black rounded"
              disabled={uploadingLogo}
            />
          </div>
          <div>
            <label className="block font-semibold">Established</label>
            <input
              type="date"
              {...register("establishedAt")}
              className="w-full p-2 border dark:text-white dark:bg-black rounded"
              disabled={uploadingLogo}
            />
          </div>
        </div>
        {/* student count & admission */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold">Student Count</label>
            <input
              type="number"
              {...register("studentCount", { valueAsNumber: true })}
              className="w-full p-2 border dark:bg-black rounded"
              disabled={uploadingLogo}
            />
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              {...register("admissionStatus")}
              disabled={uploadingLogo}
            />
            <label className="font-semibold">Admission Open</label>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold">Open Date</label>
            <input
              type="date"
              {...register("admissionPeriod.openDate")}
              className="w-full p-2 border dark:bg-black rounded"
              disabled={uploadingLogo}
            />
          </div>
          <div>
            <label className="block font-semibold">Close Date</label>
            <input
              type="date"
              {...register("admissionPeriod.closeDate")}
              className="w-full p-2 border dark:bg-black rounded"
              disabled={uploadingLogo}
            />
          </div>
        </div>
        {/* departments */}
        <div>
          <label className="font-semibold mb-1 block">Departments</label>
          {deptFields.map((d, i) => (
            <div key={d.id} className="flex items-center space-x-2 mb-2">
              <input
                {...register(`departments.${i}.name`, { required: true })}
                placeholder="Name"
                className="flex-1 p-2 border dark:bg-black rounded"
                disabled={uploadingLogo}
              />
              <button
                type="button"
                onClick={() => removeDept(i)}
                className="text-red-500"
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => appendDept({ name: "" })}
            className="px-3 py-1 bg-green-500 text-white rounded"
          >
            + Add Dept
          </button>
        </div>
        {/* logo */}
        <div>
          <label className="font-semibold block mb-1">Logo</label>
          <input
            type="file"
            {...register("logo")}
            accept="image/*"
            className="mb-2"
            disabled={uploadingLogo}
          />
          {institution?.logoUrl && (
            <img
              src={institution.logoUrl}
              alt="logo"
              className="w-24 h-24 object-contain mb-2"
            />
          )}
        </div>
        {/* social */}
        <div className="grid grid-cols-2 gap-4">
          {["facebook", "twitter", "instagram", "linkedin", "youtube"].map(
            (net) => (
              <div key={net}>
                <label className="block font-semibold">{net}</label>
                <input
                  {...register(`social.${net}`)}
                  className="w-full p-2 border dark:bg-black rounded"
                  disabled={uploadingLogo}
                />
              </div>
            )
          )}
        </div>
        {/* submit */}
        <button
          type="submit"
          disabled={uploadingLogo}
          className="w-full py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {uploadingLogo
            ? "Saving…"
            : editing
            ? "Update Institution"
            : "Create Institution"}
        </button>
      </form>

      <ResponseModal
        isOpen={modal.isOpen}
        message={modal.message}
        status={modal.status}
        onClose={() => setModal((m) => ({ ...m, isOpen: false }))}
      />
    </div>
  );
}
