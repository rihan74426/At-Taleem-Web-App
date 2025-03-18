"use client";

import { useEffect, useState } from "react";

import { useSearchParams } from "next/navigation";
import DashSidebar from "../Components/DashSidebar";
import DashProfile from "../Components/DashProfile";
import DashPosts from "../Components/DashPosts";
import DashUsers from "../Components/DashUsers";
import DashboardComp from "../Components/DashboardComp";
import AdminVideosPage from "./videos/page";

export default function Dashboard() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState("");
  useEffect(() => {
    const urlParams = new URLSearchParams(searchParams);
    const tabFromUrl = urlParams.get("tab");
    if (tabFromUrl) {
      setTab(tabFromUrl);
    }
  }, [searchParams]);
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <div className="md:w-56">
        {/* Sidebar */}
        <DashSidebar />
      </div>
      {/* profile... */}
      {tab === "profile" && <DashProfile />}

      {tab === "posts" && <DashPosts />}

      {tab === "users" && <DashUsers />}
      {tab === "addVideo" && <AdminVideosPage />}
      {tab === "dash" && <DashboardComp />}
    </div>
  );
}
