"use client";
import React, { useState } from "react";

export default function FacebookPostEmbed({ videoUrl, fallbackUrl }) {
  const [embedError, setEmbedError] = useState(false);

  const embedUrl = `https://www.facebook.com/plugins/post.php?href=https://www.facebook.com/share/v/18dbyJTjAf/&show_text=true&width=500`;

  return (
    <div>
      {embedError ? (
        <div className="p-4 bg-gray-200 text-center">
          <p>Embedding failed. Click below to view the post on Facebook.</p>
          <a
            href={fallbackUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 underline"
          >
            View on Facebook
          </a>
        </div>
      ) : (
        <iframe
          src={embedUrl}
          width="500"
          height="250"
          scrolling="no"
          frameBorder="0"
          allowFullScreen={true}
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
          onError={() => setEmbedError(true)}
        ></iframe>
      )}
    </div>
  );
}
