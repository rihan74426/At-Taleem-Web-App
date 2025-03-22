import { useState, useRef, useEffect } from "react";
import { AiOutlineEllipsis } from "react-icons/ai";

export function DropdownActions({ video, onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="relative inline-block text-left">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
      >
        <AiOutlineEllipsis size={20} />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-40 origin-top-right rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5">
          <div className="py-1">
            <button
              onClick={() => {
                setOpen(false);
                onEdit(video);
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-600"
            >
              Edit
            </button>
            <button
              onClick={() => {
                setOpen(false);
                onDelete(video._id);
              }}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:text-red-400 dark:hover:bg-gray-600"
            >
              Delete
            </button>
            {/* Future options: e.g., Pin, Favorite */}
          </div>
        </div>
      )}
    </div>
  );
}
