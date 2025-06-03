"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";

import DashSidebar from "../Components/DashSidebar";
import DashProfile from "../Components/DashProfile";
import DashPosts from "../Components/DashPosts";
import DashUsers from "../Components/DashUsers";
import DashboardComp from "../Components/DashboardComp";
import AdminVideosPage from "./videos/page";
import AskQuestionForm from "../Components/AskQuestions";
import AddBookForm from "../Components/AddBooks";
import ReviewInputPage from "../Components/ReviewInput";
import InstitutionInputPage from "../Components/InstitutionsInput";
import EventInputPage from "../Components/EventsInput";
import OrdersPage from "../orders/page";
import MasalahInput from "../Components/MasalahInput";

export default function Dashboard() {
  const { isSignedIn, user } = useUser();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState("");

  const isAdmin = user?.publicMetadata?.isAdmin;

  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    setTab(tabFromUrl || (isAdmin ? "dash" : "profile"));
  }, [searchParams, isAdmin]);

  if (!isSignedIn) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <h2>You are not Logged In</h2>
      </div>
    );
  }

  const NotAdmin = () => (
    <div className="flex justify-center items-center min-h-screen">
      <h2>You are not an Admin</h2>
    </div>
  );

  const renderContent = () => {
    switch (tab) {
      case "profile":
        return <DashProfile />;
      case "posts":
        return isAdmin ? <DashPosts /> : <NotAdmin />;
      case "users":
        return isAdmin ? <DashUsers /> : <NotAdmin />;
      case "addVideo":
        return isAdmin ? <AdminVideosPage /> : <NotAdmin />;
      case "dash":
        return isAdmin ? <DashboardComp /> : <NotAdmin />;
      case "askQuestion":
        return <AskQuestionForm />;
      case "addBooks":
        return isAdmin ? <AddBookForm /> : <NotAdmin />;
      case "review":
        return <ReviewInputPage />;
      case "institutions":
        return isAdmin ? <InstitutionInputPage /> : <NotAdmin />;
      case "events":
        return isAdmin ? <EventInputPage /> : <NotAdmin />;
      case "orders":
        return <OrdersPage />;
      case "masalah":
        return <MasalahInput />;
      default:
        return (
          <div className="flex justify-center items-center min-h-screen">
            <h2>Select a tab from the sidebar</h2>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <div className="md:w-56">
        <DashSidebar />
      </div>
      <div className="flex-1">{renderContent()}</div>
    </div>
  );
}
