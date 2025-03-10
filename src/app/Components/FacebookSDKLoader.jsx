"use client";
import { useEffect } from "react";

export default function FacebookSDKLoader({ children }) {
  useEffect(() => {
    // Create a script element
    const script = document.createElement("script");
    script.src = "https://connect.facebook.net/en_US/sdk.js";
    script.async = true;
    script.defer = true;
    script.crossOrigin = "anonymous";
    document.body.appendChild(script);

    // Initialize FB after the SDK is loaded
    script.onload = () => {
      window.fbAsyncInit = function () {
        FB.init({
          appId: "YOUR_APP_ID", // Replace with your app id
          autoLogAppEvents: true,
          xfbml: true,
          version: "v16.0",
        });
        // Optionally call FB.XFBML.parse() here if needed.
      };
    };

    // Cleanup script on unmount
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return children;
}
