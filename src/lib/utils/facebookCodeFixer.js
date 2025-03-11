// src/lib/utils/resolveFacebookUrl.js
import fetch from "node-fetch";

export async function resolveFacebookVideoUrl(shareUrl) {
  // Make a request that follows redirects
  const response = await fetch(shareUrl, { redirect: "follow" });
  return response.url; // This should be the full URL
}
