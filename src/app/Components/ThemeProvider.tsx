"use client";

import { useThemeMode } from "flowbite-react";
import { ReactNode } from "react";

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const { mode } = useThemeMode(); // ✅ Works only inside a client component

  return <div className={mode}>{children}</div>;
}
