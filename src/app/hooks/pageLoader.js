"use client";
import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import NProgress from "nprogress";
import "nprogress/nprogress.css";

export function usePageLoading() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    NProgress.start(); // Start progress bar when route starts changing

    const timer = setTimeout(() => {
      NProgress.done(); // Ensure it stops after a delay in case of fast loads
    }, 500); // Adjust time as needed

    return () => {
      clearTimeout(timer);
      NProgress.done(); // Stop progress bar when route change completes
    };
  }, [pathname, searchParams]);

  return null;
}
