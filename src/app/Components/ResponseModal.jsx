import { useState, useEffect } from "react";

export default function ResponseModal({ message, status, isOpen, onClose }) {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(onClose, 3000); // Auto close after 3s
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="bg-black/50 absolute inset-0" onClick={onClose}></div>
      <div
        className={`relative p-10 rounded-lg shadow-lg text-white ${
          status === "success" ? "bg-green-500" : "bg-red-500"
        }`}
      >
        <p>{message}</p>
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-white font-bold"
        >
          ✖
        </button>
      </div>
    </div>
  );
}
