"use client";

import { Flowbite, useThemeMode } from "flowbite-react";
import { useEffect, useState } from "react";

export default function ThemeProvider({ children }) {
  const { computedMode } = useThemeMode();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true); // Prevents SSR mismatches
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(computedMode);
  }, [computedMode]);

  if (!mounted) {
    return <div className="opacity-0">{children}</div>; // Prevent hydration mismatch
  }

  return <Flowbite>{children}</Flowbite>;
}
