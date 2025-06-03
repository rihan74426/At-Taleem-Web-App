"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import ResponseModal from "@/app/Components/ResponseModal";
import MasalahForm from "./MasalahForm";

const formatMasalahForForm = (masalah) => ({
  title: masalah.title,
  description: masalah.description || "",
  references: masalah.references || "",
  categories: masalah.categories || [],
});

export default function MasalahInput() {
  const { user, isLoaded } = useUser();
  const isAdmin = user?.publicMetadata?.isAdmin;
  const searchParams = useSearchParams();
  const formRef = useRef();

  const [loading, setLoading] = useState(true);
  const [masalah, setMasalah] = useState(null);
  const [initialData, setInitialData] = useState(null);
  const [modal, setModal] = useState({
    isOpen: false,
    message: "",
    status: "",
  });

  const showModal = (msg, status) =>
    setModal({ isOpen: true, message: msg, status });
  const id = searchParams.get("id");

  const fetchMasalah = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/masalah/${id}`);
      if (!res.ok) throw new Error("Failed to fetch masalah");
      const data = await res.json();
      if (data) {
        setMasalah(data);
        setInitialData(formatMasalahForForm(data));
      }
    } catch (err) {
      console.error(err);
      showModal("Failed to load masalah", "error");
    } finally {
      setLoading(false);
      formRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [id]);

  useEffect(() => {
    if (isLoaded) fetchMasalah();
  }, [isLoaded, fetchMasalah]);

  const onSubmit = async (data) => {
    if (!isLoaded || !isAdmin) {
      showModal("Only admins can save masalah", "error");
      return;
    }

    try {
      const payload = {
        ...data,
        createdBy: user.id,
      };

      const method = id ? "PUT" : "POST";
      const url = id ? `/api/masalah/${id}` : "/api/masalah";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to save masalah");
      }

      const result = await res.json();
      showModal(
        `Masalah ${id ? "updated" : "created"} successfully!`,
        "success"
      );
    } catch (err) {
      console.error(err);
      showModal(err.message || "Failed to save masalah", "error");
    }
  };

  const likeCount = masalah?.likers?.length || 0;
  const commentCount = masalah?.comments?.length || 0;

  if (!isLoaded || loading) {
    return <p className="p-8 text-center">Loading…</p>;
  }

  return (
    <div
      ref={formRef}
      className="max-w-2xl mx-auto p-6 m-5 bg-white dark:bg-gray-800 rounded shadow space-y-6"
    >
      <h2 className="text-2xl font-bold text-center">
        {id ? "Edit Masalah" : "New Masalah"}
      </h2>

      <MasalahForm
        initialData={initialData}
        onSubmit={onSubmit}
        isAdmin={isAdmin}
      />

      {masalah && (
        <div className="flex justify-between items-center pt-4 border-t">
          <div>
            <strong>Likes: </strong> {likeCount}
          </div>
          <div>
            <strong>Comments: </strong> {commentCount}
          </div>
        </div>
      )}

      <ResponseModal
        isOpen={modal.isOpen}
        message={modal.message}
        status={modal.status}
        onClose={() => setModal((m) => ({ ...m, isOpen: false }))}
      />
    </div>
  );
}
