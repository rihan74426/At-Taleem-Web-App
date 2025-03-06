import { useState } from "react";
import dynamic from "next/dynamic";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });
import "react-quill-new/dist/quill.snow.css";

export default function Editor({ initialData, onSave, onCancel }) {
  const [greeting, setGreeting] = useState(initialData.greeting);
  const [description, setDescription] = useState(initialData.description);

  return (
    <div className="bg-white p-4 rounded shadow">
      <input
        className="w-full p-2 border rounded"
        type="text"
        value={greeting}
        onChange={(e) => setGreeting(e.target.value)}
      />
      <ReactQuill
        value={description}
        onChange={setDescription}
        className="mt-2"
      />
      <div className="mt-4 flex justify-end gap-2">
        <button className="bg-gray-300 px-4 py-2 rounded" onClick={onCancel}>
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
