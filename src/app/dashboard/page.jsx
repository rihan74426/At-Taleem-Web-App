"use client";

import { useEffect, useState } from "react";

import { useSearchParams } from "next/navigation";
import DashSidebar from "../Components/DashSidebar";
import DashProfile from "../Components/DashProfile";
import DashPosts from "../Components/DashPosts";
import DashUsers from "../Components/DashUsers";
import DashboardComp from "../Components/DashboardComp";
import AdminVideosPage from "./videos/page";
import AskQuestionForm from "../Components/AskQuestions";
import AddBookForm from "../Components/AddBooks";
import ReviewInputPage from "../Components/ReviewInput";
import { useUser } from "@clerk/nextjs";

export default function Dashboard() {
  const user = useUser();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState("");
  useEffect(() => {
    const urlParams = new URLSearchParams(searchParams);
    const tabFromUrl = urlParams.get("tab");
    if (tabFromUrl) {
      setTab(tabFromUrl);
    } else setTab("dash");
  }, [searchParams]);
  if (user.isSignedIn) {
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
        {tab === "askQuestion" && <AskQuestionForm />}
        {tab === "addBooks" && <AddBookForm />}
        {tab === "review" && <ReviewInputPage />}
      </div>
    );
  } else {
    return (
      <div className="flex place-content-center min-h-screen">
        <h2>You are not Logged In</h2>
      </div>
    );
  }
}
