import { useState } from "react";
import dynamic from "next/dynamic";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });
import "react-quill-new/dist/quill.snow.css";

export default function Editor({ initialData, onSave, onCancel }) {
  const [greeting, setGreeting] = useState(initialData.greeting);
  const [description, setDescription] = useState(initialData.description);

  return (
    <div className="bg-white border border-blue-600 dark:bg-gray-900 p-4 rounded shadow">
      <input
        className="w-full p-2 border rounded dark:bg-black"
        type="text"
        value={greeting}
        onChange={(e) => setGreeting(e.target.value)}
      />
      <input
        className="w-full p-2 border rounded dark:bg-black"
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <div className="mt-4 flex justify-end gap-2">
        <button
          className="bg-yellow-500 text-white px-4 py-2 rounded"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded"
          onClick={() => onSave({ greeting, description })}
        >
          Save
        </button>
      </div>
    </div>
  );
}
